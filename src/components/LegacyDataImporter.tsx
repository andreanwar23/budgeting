/**
 * Legacy Data Importer Component
 *
 * Provides UI for importing transactions from legacy spreadsheet format
 */

import { useState } from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { importLegacyTransactionsBatch, validateLegacyData } from '../utils/legacyDataImporter';

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ index: number; data: any; error: string }>;
}

export function LegacyDataImporter() {
  const { user } = useAuth();
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setError('');
    setResult(null);
    setImporting(true);

    try {
      // Parse JSON input
      const data = JSON.parse(jsonInput);

      // Ensure it's an array
      const transactionsArray = Array.isArray(data) ? data : [data];

      // Validate each transaction
      const invalidItems = transactionsArray.filter((item, index) => {
        if (!validateLegacyData(item)) {
          return true;
        }
        return false;
      });

      if (invalidItems.length > 0) {
        setError(`Invalid data format. ${invalidItems.length} item(s) don't match expected structure.`);
        setImporting(false);
        return;
      }

      // Import transactions
      const importResult = await importLegacyTransactionsBatch(user.id, transactionsArray);
      setResult(importResult);
    } catch (err: any) {
      setError(err.message || 'Failed to parse or import data');
    } finally {
      setImporting(false);
    }
  };

  const exampleData = `[
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
]`;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Import Legacy Transactions
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Import transactions from your old spreadsheet format
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-2">Required Format:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>tanggal</strong>: Date in format "d/m/yyyy" (e.g., "2/12/2025")</li>
                <li><strong>tipe</strong>: "Pengeluaran" or "Pemasukan"</li>
                <li>
                  <strong>kategori</strong>: Category name (Tagihan, Lainnya, Belanja,
                  Kewajiban, Makanan, Transport, Gaji)
                </li>
                <li><strong>judul</strong>: Transaction title/merchant name</li>
                <li><strong>deskripsi</strong>: Optional description</li>
                <li><strong>jumlah</strong>: Amount as number (e.g., 7000)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* JSON Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Paste JSON Data
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-64 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm dark:bg-slate-700 dark:text-white"
              placeholder={exampleData}
            />
          </div>

          {/* Example Button */}
          <button
            type="button"
            onClick={() => setJsonInput(exampleData)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Load Example Data
          </button>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!jsonInput || importing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Upload className="w-5 h-5" />
            {importing ? 'Importing...' : 'Import Transactions'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-semibold mb-1">Import Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Success Summary */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-800 dark:text-emerald-300">
                  <p className="font-semibold mb-2">Import Complete</p>
                  <ul className="space-y-1">
                    <li>Total Transactions: {result.total}</li>
                    <li className="text-emerald-700 dark:text-emerald-400 font-medium">
                      ✓ Successfully Imported: {result.successful}
                    </li>
                    {result.failed > 0 && (
                      <li className="text-red-600 dark:text-red-400 font-medium">
                        ✗ Failed: {result.failed}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="font-semibold text-red-800 dark:text-red-300 mb-3">
                  Failed Transactions:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-red-200 dark:border-red-700"
                    >
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                        Row {err.index + 1}: {err.error}
                      </p>
                      <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                        {JSON.stringify(err.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Mapping Reference */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
          Field Mapping Reference
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 px-4 font-semibold text-slate-700 dark:text-slate-300">
                  Legacy Field
                </th>
                <th className="text-left py-2 px-4 font-semibold text-slate-700 dark:text-slate-300">
                  Current Field
                </th>
                <th className="text-left py-2 px-4 font-semibold text-slate-700 dark:text-slate-300">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              <tr>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">tanggal</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">transaction_date</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">
                  Converted to ISO format
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">tipe</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">type</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">
                  Pengeluaran → expense, Pemasukan → income
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">kategori</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">category_id</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">
                  Mapped to category table
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">judul</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">title</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">Direct mapping</td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">deskripsi</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">description</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">
                  Optional field
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">jumlah</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">amount</td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">
                  Numeric value
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
