import { LucideIcon, Info } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface StatsCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  amount: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'purple' | 'emerald';
  highlight?: boolean;
}

export function StatsCard({ title, subtitle, description, amount, icon: Icon, color, highlight = false }: StatsCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { formatCurrency } = useSettings();

  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    red: 'from-rose-500 to-pink-600',
    purple: 'from-purple-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600'
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md border ${
      highlight
        ? 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-100 dark:ring-blue-900/50 shadow-xl'
        : 'border-slate-200 dark:border-slate-700'
    } p-5 sm:p-6 hover:shadow-xl transition-all duration-300 ${
      highlight ? 'transform hover:scale-[1.02]' : 'hover:scale-[1.01]'
    } relative overflow-hidden`}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-slate-50/30 dark:from-slate-800 dark:via-transparent dark:to-slate-900/30 pointer-events-none"></div>

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className={`text-xs sm:text-sm font-bold ${
              highlight ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
            }`}>
              {title}
            </p>
            {highlight && (
              <span className="px-2.5 py-0.5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full shadow-sm">
                Aktif
              </span>
            )}
            {description && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors hover:scale-110"
                  aria-label="Info"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showTooltip && (
                  <div className="absolute left-0 top-7 z-50 w-64 sm:w-72 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-xl p-3 shadow-2xl backdrop-blur-sm">
                    <div className="absolute -top-1 left-2 w-2 h-2 bg-slate-900 dark:bg-slate-700 transform rotate-45"></div>
                    {description}
                  </div>
                )}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5 font-medium">{subtitle}</p>
          )}
          <div className={`text-xl sm:text-2xl xl:text-3xl font-extrabold tabular-nums tracking-tight ${
            highlight ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'
          } leading-tight overflow-hidden`}>
            <div className="min-w-0" style={{ wordSpacing: '-0.05em' }}>
              {formatCurrency(amount)}
            </div>
          </div>
        </div>
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-3 sm:p-4 rounded-2xl flex-shrink-0 ${
          highlight ? 'shadow-xl' : 'shadow-lg'
        } transform hover:scale-110 transition-all duration-300`}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-sm" />
        </div>
      </div>
    </div>
  );
}
