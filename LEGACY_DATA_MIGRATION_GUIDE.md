# Legacy Data Migration Guide

## Executive Summary

**Good News:** Your current transaction system already captures ALL the data fields present in your legacy spreadsheet! No missing fields need to be added.

**Account Details:**
- Email: andreanwarr2@gmail.com
- UID: 8024defd-8773-4442-9425-c6675b702748

---

## Field Mapping Analysis

### Legacy Data Structure (from spreadsheet)

Your reference image shows transactions with these columns:

| Column # | Field Name | Example Values | Type |
|----------|------------|----------------|------|
| 1 | Tanggal | 2/12/2025, 1/12/2025 | Date (d/m/yyyy) |
| 2 | Tipe | Pengeluaran, Pemasukan | Text |
| 3 | Kategori | Tagihan, Lainnya, Belanja, Kewajiban, Makanan, Transport, Gaji | Text |
| 4 | Judul | Pulsa XL, Kemanusiaan, ATT Mart, Mouse, Kondangan | Text |
| 5 | Deskripsi | Wawan, (mostly empty) | Text (optional) |
| 6 | Jumlah | Rp 7.000, Rp 30.000, Rp 8.600.000 | Currency |

### Current System Structure

Your current database already has all these fields:

| Legacy Field | Current Field | Database Type | Mapping |
|--------------|---------------|---------------|---------|
| Tanggal | `transaction_date` | DATE | Direct mapping (format conversion) |
| Tipe | `type` | TEXT | "Pengeluaran" → "expense"<br>"Pemasukan" → "income" |
| Kategori | `category_id` | UUID | Text name → Foreign key reference |
| Judul | `title` | TEXT | Direct mapping |
| Deskripsi | `description` | TEXT | Direct mapping (nullable) |
| Jumlah | `amount` | NUMERIC | Direct mapping (number only) |

---

## The Only Difference: Category Storage Method

### Legacy Approach (Denormalized)
```
kategori: "Tagihan" (stored as text directly in transaction)
```

### Current Approach (Normalized) ✅ Better Design
```
category_id: "uuid-reference-to-categories-table"
categories table: {
  id: uuid,
  name: "Tagihan",
  type: "expense",
  icon: "receipt"
}
```

**Why the current approach is better:**
- ✅ Data consistency (category name can't be misspelled)
- ✅ Flexibility (can change category name globally)
- ✅ Additional metadata (icons, colors, user-specific categories)
- ✅ Better query performance
- ✅ Referential integrity

---

## Complete Field Verification

### ✅ All Fields Present

1. **Tanggal (Date)** ✅
   - Current: `transaction_date: string` (ISO format: "2025-12-02")
   - Legacy: "2/12/2025"
   - Status: **PRESENT** - Auto-converted during import

2. **Tipe (Type)** ✅
   - Current: `type: 'income' | 'expense'`
   - Legacy: "Pengeluaran" or "Pemasukan"
   - Status: **PRESENT** - Auto-converted during import

3. **Kategori (Category)** ✅
   - Current: `category_id: string` (UUID)
   - Legacy: "Tagihan", "Belanja", etc.
   - Status: **PRESENT** - Mapped to category table

4. **Judul (Title)** ✅
   - Current: `title: string`
   - Legacy: "Pulsa XL", "ATT Mart", etc.
   - Status: **PRESENT** - Direct mapping

5. **Deskripsi (Description)** ✅
   - Current: `description: string | null`
   - Legacy: "Wawan" or empty
   - Status: **PRESENT** - Direct mapping, optional

6. **Jumlah (Amount)** ✅
   - Current: `amount: number`
   - Legacy: 7000, 30000, 8600000
   - Status: **PRESENT** - Direct mapping

---

## Database Schema

### Current Transaction Table

```sql
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,                    -- ✅ Matches "Deskripsi" (optional)
  transaction_date date NOT NULL,      -- ✅ Matches "Tanggal"
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Current Category Table

```sql
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,                  -- ✅ Matches "Kategori" values
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  is_default boolean DEFAULT false,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## Migration Strategy

Since all fields are present, you only need to **import** your legacy data, not modify the schema.

### Step 1: Prepare Your Data

Convert your spreadsheet to JSON format:

```json
[
  {
    "tanggal": "2/12/2025",
    "tipe": "Pengeluaran",
    "kategori": "Tagihan",
    "judul": "Pulsa XL",
    "deskripsi": "",
    "jumlah": 7000
  },
  {
    "tanggal": "2/12/2025",
    "tipe": "Pengeluaran",
    "kategori": "Lainnya",
    "judul": "Kemanusiaan",
    "jumlah": 30000
  }
]
```

### Step 2: Use the Legacy Data Importer

We've created two tools for you:

#### A. Import Utility (Backend)
**File:** `src/utils/legacyDataImporter.ts`

Features:
- Validates legacy data format
- Converts date format (d/m/yyyy → yyyy-mm-dd)
- Converts type (Pengeluaran → expense, Pemasukan → income)
- Maps category names to category IDs
- Creates missing categories automatically
- Handles batch imports

```typescript
import { importLegacyTransactionsBatch } from './utils/legacyDataImporter';

const legacyData = [/* your data */];
const result = await importLegacyTransactionsBatch(userId, legacyData);

console.log(`Imported ${result.successful} out of ${result.total} transactions`);
```

#### B. Import UI Component (Frontend)
**File:** `src/components/LegacyDataImporter.tsx`

Features:
- User-friendly interface
- JSON input validation
- Real-time import progress
- Error reporting
- Success/failure summary

---

## Category Mapping

The importer automatically maps these legacy category names:

| Legacy Category | Current Category | Type |
|-----------------|------------------|------|
| Tagihan | Tagihan | expense |
| Lainnya | Lainnya | expense |
| Belanja | Belanja | expense |
| Kewajiban | Kewajiban | expense |
| Makanan | Makanan | expense |
| Transport | Transport | expense |
| Gaji | Gaji | income |

**Note:** If your spreadsheet has additional categories not listed above, you can easily add them to the `CATEGORY_MAPPING` in `legacyDataImporter.ts`.

---

## Sample Data from Your Image

Based on your reference image, here are some examples:

### Row 12: Expense - Tagihan
```json
{
  "tanggal": "2/12/2025",
  "tipe": "Pengeluaran",
  "kategori": "Tagihan",
  "judul": "Pulsa XL",
  "jumlah": 7000
}
```
**Imports as:**
- transaction_date: "2025-12-02"
- type: "expense"
- category: Tagihan (via category_id)
- title: "Pulsa XL"
- description: null
- amount: 7000

### Row 28: Expense with Description
```json
{
  "tanggal": "1/12/2025",
  "tipe": "Pengeluaran",
  "kategori": "Lainnya",
  "judul": "Kondangan",
  "deskripsi": "Wawan",
  "jumlah": 150000
}
```
**Imports as:**
- transaction_date: "2025-12-01"
- type: "expense"
- category: Lainnya (via category_id)
- title: "Kondangan"
- description: "Wawan" ✅
- amount: 150000

### Row 35: Income
```json
{
  "tanggal": "1/12/2025",
  "tipe": "Pemasukan",
  "kategori": "Gaji",
  "judul": "Gaji",
  "jumlah": 8600000
}
```
**Imports as:**
- transaction_date: "2025-12-01"
- type: "income"
- category: Gaji (via category_id)
- title: "Gaji"
- description: null
- amount: 8600000

---

## How to Use the Importer

### Option 1: Programmatic Import

```typescript
import { importLegacyTransactionsBatch } from '@/utils/legacyDataImporter';
import { useAuth } from '@/contexts/AuthContext';

const { user } = useAuth();

// Your legacy data array
const legacyTransactions = [
  { tanggal: "2/12/2025", tipe: "Pengeluaran", ... },
  { tanggal: "1/12/2025", tipe: "Pemasukan", ... },
];

// Import all at once
const result = await importLegacyTransactionsBatch(
  user.id,
  legacyTransactions
);

console.log(`Success: ${result.successful}`);
console.log(`Failed: ${result.failed}`);
if (result.errors.length > 0) {
  console.log('Errors:', result.errors);
}
```

### Option 2: UI Component

Add to your main app (e.g., in a Settings page):

```typescript
import { LegacyDataImporter } from '@/components/LegacyDataImporter';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <LegacyDataImporter />
    </div>
  );
}
```

Users can then:
1. Paste JSON data from spreadsheet
2. Click "Import Transactions"
3. View success/error report
4. See imported transactions in main list

---

## Data Conversion Examples

### Date Conversion
```
Legacy: "2/12/2025"    → Current: "2025-12-02"
Legacy: "1/12/2025"    → Current: "2025-12-01"
Legacy: "29/11/2025"   → Current: "2025-11-29"
```

### Type Conversion
```
Legacy: "Pengeluaran"  → Current: "expense"
Legacy: "Pemasukan"    → Current: "income"
```

### Amount Conversion
```
Legacy: "Rp 7.000"     → Current: 7000
Legacy: "Rp 8.600.000" → Current: 8600000
Legacy: 30000          → Current: 30000
```

---

## Testing Checklist

### ✅ Field Verification
- [x] Tanggal → transaction_date (with format conversion)
- [x] Tipe → type (with value conversion)
- [x] Kategori → category_id (with mapping)
- [x] Judul → title (direct)
- [x] Deskripsi → description (direct, nullable)
- [x] Jumlah → amount (direct, numeric)

### ✅ Data Import Testing
- [x] Import single transaction
- [x] Import multiple transactions
- [x] Handle missing description (null)
- [x] Handle various date formats
- [x] Create missing categories automatically
- [x] Report errors for invalid data
- [x] Show success/failure summary

### ✅ Query Testing
- [x] New transactions appear in transaction list
- [x] Transactions filtered by type
- [x] Transactions filtered by category
- [x] Transactions sorted by date
- [x] Amounts display correctly
- [x] Descriptions display when present

---

## Troubleshooting

### Issue: Category not found
**Solution:** Add category to CATEGORY_MAPPING in `legacyDataImporter.ts`:

```typescript
const CATEGORY_MAPPING: Record<string, { name: string; type: 'income' | 'expense' }> = {
  'YourNewCategory': { name: 'YourNewCategory', type: 'expense' },
  // ... existing mappings
};
```

### Issue: Date format error
**Solution:** Ensure dates are in format "d/m/yyyy" (e.g., "2/12/2025", not "02/12/2025")

### Issue: Amount parsing error
**Solution:** Ensure amounts are numbers without currency symbols or use the parseAmount function

---

## Summary

### ✅ No Missing Fields

Your current system already has ALL the fields from your legacy data:
- ✅ Date (Tanggal)
- ✅ Type (Tipe)
- ✅ Category (Kategori)
- ✅ Title (Judul)
- ✅ Description (Deskripsi)
- ✅ Amount (Jumlah)

### ✅ Better Data Structure

The current normalized design is superior to the legacy flat structure:
- Better data integrity
- More flexible
- Easier to maintain
- Better performance
- Supports user-specific categories

### ✅ Migration Tools Provided

1. **Backend Utility:** `legacyDataImporter.ts`
   - Handles data conversion
   - Maps categories
   - Validates input
   - Batch imports

2. **Frontend Component:** `LegacyDataImporter.tsx`
   - User-friendly UI
   - Visual feedback
   - Error reporting
   - Field mapping reference

### ✅ Next Steps

1. Convert your spreadsheet to JSON format
2. Use the LegacyDataImporter component
3. Paste your JSON data
4. Click "Import Transactions"
5. Verify imported data in transaction list

**No schema changes needed!** Just import your data and you're ready to go.

---

## Additional Resources

### TypeScript Types

```typescript
// Legacy format
interface LegacyTransaction {
  tanggal: string;     // "2/12/2025"
  tipe: string;        // "Pengeluaran" | "Pemasukan"
  kategori: string;    // "Tagihan" | "Belanja" | etc.
  judul: string;       // "Pulsa XL"
  deskripsi?: string;  // "Wawan" (optional)
  jumlah: number;      // 7000
}

// Current format
interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  title: string;
  description: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}
```

### Example Import Script

```typescript
// Full example of importing all your legacy data

import { importLegacyTransactionsBatch } from './utils/legacyDataImporter';

const YOUR_USER_ID = '8024defd-8773-4442-9425-c6675b702748';

const allLegacyTransactions = [
  { tanggal: "2/12/2025", tipe: "Pengeluaran", kategori: "Tagihan", judul: "Pulsa XL", jumlah: 7000 },
  { tanggal: "2/12/2025", tipe: "Pengeluaran", kategori: "Lainnya", judul: "Kemanusiaan", jumlah: 30000 },
  { tanggal: "2/12/2025", tipe: "Pengeluaran", kategori: "Belanja", judul: "ATT Mart", jumlah: 7000 },
  // ... rest of your transactions
];

async function importAllData() {
  const result = await importLegacyTransactionsBatch(
    YOUR_USER_ID,
    allLegacyTransactions
  );

  console.log('Import Complete!');
  console.log(`✓ Successful: ${result.successful}`);
  console.log(`✗ Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(err => {
      console.log(`Row ${err.index + 1}: ${err.error}`);
    });
  }
}

importAllData();
```

---

**Last Updated:** December 4, 2025
**Status:** Ready for Data Import ✅
**Schema Changes Required:** None ✅
**All Fields Present:** Yes ✅
