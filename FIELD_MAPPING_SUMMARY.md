# Transaction Field Mapping - Quick Reference

## 🎯 Executive Summary

**All fields from your legacy data are already present in the current system!**

No database schema changes needed. Only data import required.

---

## 📊 Field Comparison Table

| # | Legacy Field<br>(Spreadsheet) | Current Field<br>(Database) | Status | Conversion |
|---|-------------------------------|----------------------------|---------|------------|
| 1 | **Tanggal**<br>Example: "2/12/2025" | `transaction_date`<br>Type: DATE | ✅ Present | Format: d/m/yyyy → yyyy-mm-dd |
| 2 | **Tipe**<br>Example: "Pengeluaran" | `type`<br>Type: TEXT | ✅ Present | "Pengeluaran" → "expense"<br>"Pemasukan" → "income" |
| 3 | **Kategori**<br>Example: "Tagihan" | `category_id`<br>Type: UUID | ✅ Present | Text name → Foreign key<br>(mapped via categories table) |
| 4 | **Judul**<br>Example: "Pulsa XL" | `title`<br>Type: TEXT | ✅ Present | Direct mapping (no conversion) |
| 5 | **Deskripsi**<br>Example: "Wawan" | `description`<br>Type: TEXT | ✅ Present | Direct mapping (nullable) |
| 6 | **Jumlah**<br>Example: 7000 | `amount`<br>Type: NUMERIC | ✅ Present | Direct mapping (numeric only) |

---

## ✅ Verification Checklist

### Required Fields Present
- [x] **Date field** - `transaction_date` captures "Tanggal"
- [x] **Type field** - `type` captures "Tipe" (income/expense)
- [x] **Category field** - `category_id` captures "Kategori" (via foreign key)
- [x] **Title field** - `title` captures "Judul"
- [x] **Description field** - `description` captures "Deskripsi" (optional)
- [x] **Amount field** - `amount` captures "Jumlah"

### Additional System Fields (Auto-generated)
- [x] `id` - Unique transaction identifier (UUID)
- [x] `user_id` - User ownership (8024defd-8773-4442-9425-c6675b702748)
- [x] `created_at` - Creation timestamp
- [x] `updated_at` - Last modification timestamp

---

## 🔄 Data Conversion Quick Reference

### Example 1: Simple Expense
**Legacy:**
```
Tanggal: 2/12/2025
Tipe: Pengeluaran
Kategori: Tagihan
Judul: Pulsa XL
Deskripsi: (empty)
Jumlah: 7000
```

**Current:**
```json
{
  "transaction_date": "2025-12-02",
  "type": "expense",
  "category_id": "uuid-of-tagihan-category",
  "title": "Pulsa XL",
  "description": null,
  "amount": 7000
}
```

### Example 2: Expense with Description
**Legacy:**
```
Tanggal: 1/12/2025
Tipe: Pengeluaran
Kategori: Lainnya
Judul: Kondangan
Deskripsi: Wawan
Jumlah: 150000
```

**Current:**
```json
{
  "transaction_date": "2025-12-01",
  "type": "expense",
  "category_id": "uuid-of-lainnya-category",
  "title": "Kondangan",
  "description": "Wawan",
  "amount": 150000
}
```

### Example 3: Income
**Legacy:**
```
Tanggal: 1/12/2025
Tipe: Pemasukan
Kategori: Gaji
Judul: Gaji
Deskripsi: (empty)
Jumlah: 8600000
```

**Current:**
```json
{
  "transaction_date": "2025-12-01",
  "type": "income",
  "category_id": "uuid-of-gaji-category",
  "title": "Gaji",
  "description": null,
  "amount": 8600000
}
```

---

## 🛠️ Tools Provided

### 1. Backend Import Utility
**File:** `src/utils/legacyDataImporter.ts`

**Functions:**
- `importLegacyTransaction()` - Import single transaction
- `importLegacyTransactionsBatch()` - Import multiple transactions
- `validateLegacyData()` - Validate data format
- `findOrCreateCategory()` - Auto-create categories

**Usage:**
```typescript
import { importLegacyTransactionsBatch } from './utils/legacyDataImporter';

const result = await importLegacyTransactionsBatch(userId, legacyData);
console.log(`Imported: ${result.successful}/${result.total}`);
```

### 2. Frontend Import Component
**File:** `src/components/LegacyDataImporter.tsx`

**Features:**
- JSON data input interface
- Real-time validation
- Import progress tracking
- Error reporting with details
- Field mapping reference table

**Integration:**
```typescript
import { LegacyDataImporter } from './components/LegacyDataImporter';

<LegacyDataImporter />
```

---

## 📝 Category Mapping

Your legacy categories are automatically mapped:

| Legacy Category | Current Category | Type |
|-----------------|------------------|------|
| Tagihan | Tagihan | expense |
| Lainnya | Lainnya | expense |
| Belanja | Belanja | expense |
| Kewajiban | Kewajiban | expense |
| Makanan | Makanan | expense |
| Transport | Transport | expense |
| Gaji | Gaji | income |

**Note:** Categories are created automatically if they don't exist.

---

## 🚀 Quick Start Import

### Step 1: Prepare JSON Data
Convert your spreadsheet to JSON:

```json
[
  {
    "tanggal": "2/12/2025",
    "tipe": "Pengeluaran",
    "kategori": "Tagihan",
    "judul": "Pulsa XL",
    "jumlah": 7000
  },
  {
    "tanggal": "1/12/2025",
    "tipe": "Pemasukan",
    "kategori": "Gaji",
    "judul": "Gaji",
    "jumlah": 8600000
  }
]
```

### Step 2: Import via UI
1. Open the Legacy Data Importer component
2. Paste your JSON data
3. Click "Import Transactions"
4. Review success/error report

### Step 3: Verify
Check your transaction list to see imported data.

---

## ⚠️ Important Notes

### ✅ What Works Automatically
- Date format conversion (d/m/yyyy → yyyy-mm-dd)
- Type conversion (Pengeluaran/Pemasukan → expense/income)
- Category creation (if doesn't exist)
- Null handling for empty descriptions
- Amount parsing (removes currency symbols)

### ❌ What to Avoid
- Don't include "Rp" prefix in amounts (auto-removed)
- Don't use wrong date format (must be d/m/yyyy)
- Don't use category names not in mapping (add them first)
- Don't leave required fields empty (tanggal, tipe, kategori, judul, jumlah)

---

## 📋 Testing Examples

### Valid Import Data
```json
{
  "tanggal": "2/12/2025",      ✅ Valid date format
  "tipe": "Pengeluaran",       ✅ Valid type
  "kategori": "Belanja",       ✅ Mapped category
  "judul": "Mouse",            ✅ Any text
  "deskripsi": "Gaming",       ✅ Optional
  "jumlah": 245000             ✅ Numeric
}
```

### Invalid Import Data
```json
{
  "tanggal": "2025-12-02",     ❌ Wrong date format
  "tipe": "Expense",           ❌ Wrong type value
  "kategori": "Unknown",       ❌ Not in mapping
  "judul": "",                 ❌ Empty required field
  "jumlah": "Rp 245.000"       ⚠️ Works but not recommended
}
```

---

## 🎓 Key Takeaways

1. **All fields present** - No schema changes needed ✅
2. **Better design** - Normalized structure is superior ✅
3. **Auto conversion** - Tools handle format differences ✅
4. **Easy import** - Simple UI for data migration ✅
5. **Data integrity** - RLS ensures user data security ✅

---

## 📞 Support

### Documentation Files
- **Comprehensive Guide:** `LEGACY_DATA_MIGRATION_GUIDE.md`
- **Quick Reference:** This file
- **Code Documentation:** Comments in source files

### Common Issues
- **Category not found:** Add to CATEGORY_MAPPING
- **Date parse error:** Check format is d/m/yyyy
- **Import fails:** Validate JSON format

---

**Summary:** Your current system already has ALL required fields. Just use the import tools to migrate your legacy data!

**Status:** Ready to Import ✅
**Schema Changes:** None Required ✅
**Data Migration:** Tools Provided ✅
