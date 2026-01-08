import { X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface BreakdownItem {
  label: string;
  amount: number;
  icon: string;
  color: string;
}

interface BalanceBreakdownModalProps {
  title: string;
  items: BreakdownItem[];
  total: number;
  isOpen: boolean;
  onClose: () => void;
  onViewTransactions?: () => void;
}

export function BalanceBreakdownModal({
  title,
  items,
  total,
  isOpen,
  onClose,
  onViewTransactions
}: BalanceBreakdownModalProps) {
  const { formatCurrency, language } = useSettings();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 id="modal-title" className="text-xl font-bold text-slate-800 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label={language === 'en' ? 'Close' : 'Tutup'}
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                </div>
                <span className={`text-base font-bold tabular-nums ${item.color}`}>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between py-4 border-t-2 border-slate-300 dark:border-slate-600 mt-4">
              <span className="text-base font-bold text-slate-800 dark:text-white">
                {language === 'en' ? 'Net Balance' : 'Saldo Bersih'}
              </span>
              <span className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {onViewTransactions && (
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={onViewTransactions}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {language === 'en' ? 'View Detailed Transactions' : 'Lihat Transaksi Detail'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
