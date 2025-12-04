# Database Migration Deployment Guide

## Issue Summary

**Error:** `Could not find the 'loan_date' column of 'kasbon' in the schema cache`

**Root Cause:**
Migration conflict where the `create_core_tables` migration overwrote the kasbon table schema, replacing `loan_date` column with `type` column. The application expects `loan_date` but the database has `type`.

**Migration Conflict Timeline:**
1. Migration `20251128035819` created kasbon WITH `loan_date` ✓
2. Migration `20251128075532` recreated kasbon WITH `type` instead ✗
3. Migration `20251128083212` attempted to fix by adding `loan_date` back
4. Current state: Schema mismatch causing application errors

## Solution Options

### Option 1: Apply Consolidated Migration (Recommended for New Deployments)

If starting fresh or can reset the database:

```sql
-- Execute: CONSOLIDATED_MIGRATION_FIXED.sql
-- This file creates all tables with correct schema from the start
```

**Advantages:**
- Clean, single migration
- No schema conflicts
- Optimized from the start
- Easier to maintain

**Use when:**
- New deployment
- Development environment
- Can afford to recreate database

### Option 2: Apply Quick Fix (Recommended for Production)

If database already has data that must be preserved:

```sql
-- Quick fix to add missing loan_date column and remove unused type column
-- This is safe and non-destructive

-- Step 1: Add loan_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kasbon' AND column_name = 'loan_date'
  ) THEN
    ALTER TABLE kasbon ADD COLUMN loan_date date NOT NULL DEFAULT CURRENT_DATE;

    -- If you had data with created_at, you might want to use that as loan_date
    -- UPDATE kasbon SET loan_date = created_at::date WHERE loan_date IS NULL;
  END IF;
END $$;

-- Step 2: Remove type column if it exists (not used by application)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kasbon' AND column_name = 'type'
  ) THEN
    ALTER TABLE kasbon DROP COLUMN type;
  END IF;
END $$;

-- Step 3: Add paid_date column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kasbon' AND column_name = 'paid_date'
  ) THEN
    ALTER TABLE kasbon ADD COLUMN paid_date timestamptz;
  END IF;
END $$;

-- Step 4: Ensure index exists
CREATE INDEX IF NOT EXISTS idx_kasbon_loan_date ON kasbon(loan_date DESC);

-- Step 5: Verify the fix
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'kasbon'
ORDER BY ordinal_position;
```

**Advantages:**
- Non-destructive
- Preserves existing data
- Quick to execute
- Production-safe

**Use when:**
- Production environment with data
- Cannot afford downtime
- Need to preserve existing records

## Deployment Steps

### For Development/Testing (Fresh Start)

1. **Backup Current Database** (if any data exists)
   ```bash
   # Via Supabase Dashboard: Database > Backups > Create Backup
   ```

2. **Drop Existing Schema** (optional, only if starting fresh)
   ```sql
   DROP TABLE IF EXISTS user_profiles CASCADE;
   DROP TABLE IF EXISTS user_settings CASCADE;
   DROP TABLE IF EXISTS kasbon CASCADE;
   DROP TABLE IF EXISTS transactions CASCADE;
   DROP TABLE IF EXISTS categories CASCADE;
   DROP FUNCTION IF EXISTS update_updated_at_column();
   ```

3. **Execute Consolidated Migration**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Copy contents of `CONSOLIDATED_MIGRATION_FIXED.sql`
   - Execute the script
   - Verify with verification queries at the end

4. **Test the Application**
   ```bash
   npm run dev
   # Navigate to Kasbon section and test creating/viewing records
   ```

### For Production (Data Preservation)

1. **Backup Database** (CRITICAL!)
   ```bash
   # Via Supabase Dashboard: Database > Backups > Create Backup
   # Wait for confirmation before proceeding
   ```

2. **Execute Quick Fix**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Copy the "Quick Fix" SQL from Option 2 above
   - Execute the script
   - Verify column changes

3. **Verify Schema**
   ```sql
   -- Should show: loan_date, NO type column
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'kasbon'
   ORDER BY ordinal_position;
   ```

4. **Test Application**
   - Restart application
   - Test kasbon CRUD operations
   - Verify existing data is intact

5. **Monitor Errors**
   - Check application logs
   - Monitor Supabase logs
   - Verify no RLS policy issues

## Verification Checklist

After deployment, verify:

- [ ] Kasbon table has `loan_date` column
- [ ] Kasbon table does NOT have `type` column
- [ ] Kasbon table has `paid_date` column
- [ ] All indexes are created
- [ ] RLS policies are active
- [ ] Can create new kasbon records
- [ ] Can view existing kasbon records
- [ ] Can update kasbon records
- [ ] Can delete kasbon records
- [ ] No console errors in application

## Verification Queries

```sql
-- 1. Check kasbon schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'kasbon'
ORDER BY ordinal_position;

-- Expected columns:
-- id, user_id, name, amount, loan_date, due_date, status, paid_date, notes, created_at, updated_at

-- 2. Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'kasbon';

-- 3. Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'kasbon';

-- 4. Test data insert (should succeed)
INSERT INTO kasbon (user_id, name, amount, loan_date, status)
VALUES (auth.uid(), 'Test Loan', 100000, CURRENT_DATE, 'unpaid');

-- 5. Test data select (should return the record)
SELECT * FROM kasbon WHERE name = 'Test Loan';

-- 6. Cleanup test data
DELETE FROM kasbon WHERE name = 'Test Loan';
```

## Troubleshooting

### Issue: "Column loan_date does not exist"
**Solution:** Execute Option 2 quick fix to add the column

### Issue: "Column type does not exist"
**Solution:** This is expected - the application doesn't use type column

### Issue: RLS policy prevents access
**Solution:** Ensure user is authenticated and policies use `(select auth.uid())`

### Issue: Foreign key constraint violation
**Solution:** Ensure categories table is populated with default categories first

### Issue: Migration fails with "relation already exists"
**Solution:** This is normal - the script uses `IF NOT EXISTS` clauses

## Post-Deployment

1. **Update Migration Files**
   - Consider creating a new migration file with the fix
   - Document the schema change in CHANGELOG.md

2. **Update Documentation**
   - Update database schema documentation
   - Add notes about kasbon table structure

3. **Monitor Performance**
   - Check query performance on kasbon table
   - Verify indexes are being used

4. **Team Communication**
   - Notify team of schema changes
   - Update local development environments

## Contact

If issues persist:
1. Check Supabase logs in Dashboard > Logs
2. Check application console for detailed errors
3. Verify RLS policies are not blocking legitimate access
4. Ensure migrations were executed in correct order
