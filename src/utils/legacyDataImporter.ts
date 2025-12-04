/**
 * Legacy Transaction Data Importer
 *
 * This utility helps import transactions from the legacy spreadsheet format
 * into the current normalized database structure.
 *
 * User: andreanwarr2@gmail.com
 * UID: 8024defd-8773-4442-9425-c6675b702748
 */

import { supabase } from '../lib/supabase';

/**
 * Legacy transaction format (from spreadsheet)
 */
interface LegacyTransaction {
  tanggal: string;           // Date in format: d/m/yyyy (e.g., "2/12/2025")
  tipe: string;              // "Pengeluaran" or "Pemasukan"
  kategori: string;          // Text category name
  judul: string;             // Title/merchant name
  deskripsi?: string;        // Optional description
  jumlah: number | string;   // Amount (may include "Rp" prefix)
}

/**
 * Category name mapping from legacy text to standardized names
 */
const CATEGORY_MAPPING: Record<string, { name: string; type: 'income' | 'expense' }> = {
  // Expense categories
  'Tagihan': { name: 'Tagihan', type: 'expense' },
  'Lainnya': { name: 'Lainnya', type: 'expense' },
  'Belanja': { name: 'Belanja', type: 'expense' },
  'Kewajiban': { name: 'Kewajiban', type: 'expense' },
  'Makanan': { name: 'Makanan', type: 'expense' },
  'Transport': { name: 'Transport', type: 'expense' },

  // Income categories
  'Gaji': { name: 'Gaji', type: 'income' },

  // Add more mappings as needed
};

/**
 * Parse Indonesian date format (d/m/yyyy) to ISO format (yyyy-mm-dd)
 */
function parseIndonesianDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toISOString().split('T')[0];
}

/**
 * Parse amount - remove "Rp" prefix and convert to number
 */
function parseAmount(amount: number | string): number {
  if (typeof amount === 'number') return amount;

  // Remove "Rp", spaces, and dots (thousand separators)
  const cleaned = amount.replace(/Rp\s*/g, '').replace(/\./g, '').replace(/,/g, '');
  return parseFloat(cleaned);
}

/**
 * Convert legacy transaction type to current format
 */
function convertType(tipe: string): 'income' | 'expense' {
  if (tipe === 'Pemasukan') return 'income';
  if (tipe === 'Pengeluaran') return 'expense';
  throw new Error(`Unknown transaction type: ${tipe}`);
}

/**
 * Find or create category by name
 */
async function findOrCreateCategory(
  userId: string,
  categoryName: string,
  type: 'income' | 'expense'
): Promise<string> {
  // First, try to find existing category
  const { data: existing, error: searchError } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', categoryName)
    .eq('type', type)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  // If not found, create new category
  const { data: newCategory, error: createError } = await supabase
    .from('categories')
    .insert([{
      user_id: userId,
      name: categoryName,
      type: type,
      is_default: false,
      icon: 'circle' // Default icon
    }])
    .select('id')
    .single();

  if (createError || !newCategory) {
    throw new Error(`Failed to create category: ${createError?.message}`);
  }

  return newCategory.id;
}

/**
 * Import a single legacy transaction
 */
export async function importLegacyTransaction(
  userId: string,
  legacyData: LegacyTransaction
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // Convert date format
    const transactionDate = parseIndonesianDate(legacyData.tanggal);

    // Convert type
    const type = convertType(legacyData.tipe);

    // Parse amount
    const amount = parseAmount(legacyData.jumlah);

    // Get category mapping
    const categoryInfo = CATEGORY_MAPPING[legacyData.kategori];
    if (!categoryInfo) {
      return {
        success: false,
        error: `Unknown category: ${legacyData.kategori}. Please add to CATEGORY_MAPPING.`
      };
    }

    // Find or create category
    const categoryId = await findOrCreateCategory(
      userId,
      categoryInfo.name,
      categoryInfo.type
    );

    // Insert transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        amount: amount,
        type: type,
        category_id: categoryId,
        title: legacyData.judul,
        description: legacyData.deskripsi || null,
        transaction_date: transactionDate
      }])
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      transactionId: data.id
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Import multiple legacy transactions in batch
 */
export async function importLegacyTransactionsBatch(
  userId: string,
  legacyData: LegacyTransaction[]
): Promise<{
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ index: number; data: LegacyTransaction; error: string }>;
}> {
  const results = {
    total: legacyData.length,
    successful: 0,
    failed: 0,
    errors: [] as Array<{ index: number; data: LegacyTransaction; error: string }>
  };

  for (let i = 0; i < legacyData.length; i++) {
    const result = await importLegacyTransaction(userId, legacyData[i]);

    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
      results.errors.push({
        index: i,
        data: legacyData[i],
        error: result.error || 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Validate legacy data format
 */
export function validateLegacyData(data: any): data is LegacyTransaction {
  return (
    typeof data === 'object' &&
    typeof data.tanggal === 'string' &&
    typeof data.tipe === 'string' &&
    typeof data.kategori === 'string' &&
    typeof data.judul === 'string' &&
    (data.jumlah !== undefined)
  );
}

/**
 * Example usage for importing from spreadsheet
 */
export const EXAMPLE_LEGACY_DATA: LegacyTransaction[] = [
  {
    tanggal: '2/12/2025',
    tipe: 'Pengeluaran',
    kategori: 'Tagihan',
    judul: 'Pulsa XL',
    jumlah: 7000
  },
  {
    tanggal: '2/12/2025',
    tipe: 'Pengeluaran',
    kategori: 'Lainnya',
    judul: 'Kemanusiaan',
    jumlah: 30000
  },
  {
    tanggal: '1/12/2025',
    tipe: 'Pengeluaran',
    kategori: 'Lainnya',
    judul: 'Kondangan',
    deskripsi: 'Wawan',
    jumlah: 150000
  },
  {
    tanggal: '1/12/2025',
    tipe: 'Pemasukan',
    kategori: 'Gaji',
    judul: 'Gaji',
    jumlah: 8600000
  }
];
