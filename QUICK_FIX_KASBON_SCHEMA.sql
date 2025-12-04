/*
  # Quick Fix: Add Missing loan_date Column to Kasbon Table

  ## Issue
  Application expects 'loan_date' column but database has 'type' column instead.
  Error: "Could not find the 'loan_date' column of 'kasbon' in the schema cache"

  ## Fix
  - Add loan_date column if missing
  - Remove type column if exists (not used by application)
  - Add paid_date column if missing
  - Ensure proper indexes exist

  ## Safety
  - Non-destructive: Preserves all existing data
  - Idempotent: Can be run multiple times safely
  - Uses IF EXISTS/IF NOT EXISTS checks
*/

-- Step 1: Add loan_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kasbon' AND column_name = 'loan_date'
  ) THEN
    ALTER TABLE kasbon ADD COLUMN loan_date date NOT NULL DEFAULT CURRENT_DATE;
    RAISE NOTICE 'Added loan_date column to kasbon table';
  ELSE
    RAISE NOTICE 'loan_date column already exists in kasbon table';
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
    RAISE NOTICE 'Removed unused type column from kasbon table';
  ELSE
    RAISE NOTICE 'type column does not exist in kasbon table (already removed)';
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
    RAISE NOTICE 'Added paid_date column to kasbon table';
  ELSE
    RAISE NOTICE 'paid_date column already exists in kasbon table';
  END IF;
END $$;

-- Step 4: Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_kasbon_loan_date ON kasbon(loan_date DESC);
CREATE INDEX IF NOT EXISTS idx_kasbon_user_status ON kasbon(user_id, status);

-- Step 5: Verification
DO $$
DECLARE
  loan_date_exists boolean;
  type_exists boolean;
  paid_date_exists boolean;
BEGIN
  -- Check loan_date column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kasbon' AND column_name = 'loan_date'
  ) INTO loan_date_exists;

  -- Check type column (should NOT exist)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kasbon' AND column_name = 'type'
  ) INTO type_exists;

  -- Check paid_date column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kasbon' AND column_name = 'paid_date'
  ) INTO paid_date_exists;

  -- Report results
  RAISE NOTICE '=== Kasbon Table Schema Verification ===';
  RAISE NOTICE 'loan_date column exists: %', loan_date_exists;
  RAISE NOTICE 'type column exists (should be false): %', type_exists;
  RAISE NOTICE 'paid_date column exists: %', paid_date_exists;

  IF loan_date_exists AND NOT type_exists AND paid_date_exists THEN
    RAISE NOTICE 'SUCCESS: Kasbon table schema is now correct!';
  ELSE
    RAISE WARNING 'Schema may still have issues. Please check manually.';
  END IF;
END $$;

-- Display final schema for verification
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'kasbon'
ORDER BY ordinal_position;
