import { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { id as localeId, enUS as localeEn } from 'date-fns/locale';
import { useSettings } from '../contexts/SettingsContext';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const { language } = useSettings();
  const isEn = language === 'en';
  const locale = isEn ? localeEn : localeId;

  const [showDropdown, setShowDropdown] = useState(false);
  const [customRange, setCustomRange] = useState(false);
  const thisMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const thisMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(thisMonthStart);
  const [endDate, setEndDate] = useState(thisMonthEnd);
  const [selectedPreset, setSelectedPreset] = useState('this-month');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      onDateRangeChange(thisMonthStart, thisMonthEnd);
      setInitialized(true);
    }
  }, [initialized, thisMonthStart, thisMonthEnd, onDateRangeChange]);

  const presets = [
    { id: 'today', icon: '📅' },
    { id: 'all', icon: '📊' },
    { id: 'this-month', icon: '📆' },
    { id: 'last-month', icon: '📋' },
    { id: 'last-3-months', icon: '📈' },
    { id: 'custom', icon: '🗓️' }
  ];

  const getPresetLabel = (id: string) => {
    switch (id) {
      case 'today':
        return isEn ? 'Today' : 'Hari Ini';
      case 'all':
        return isEn ? 'All Data' : 'Semua Data';
      case 'this-month':
        return isEn ? 'This Month' : 'Bulan Ini';
      case 'last-month':
        return isEn ? 'Last Month' : 'Bulan Lalu';
      case 'last-3-months':
        return isEn ? 'Last 3 Months' : '3 Bulan Terakhir';
      case 'custom':
        return isEn ? 'Choose Dates' : 'Pilih Tanggal';
      default:
        return id;
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const todayDate = new Date();

    switch (presetId) {
      case 'today': {
        const todayStr = format(todayDate, 'yyyy-MM-dd');
        setStartDate(todayStr);
        setEndDate(todayStr);
        setCustomRange(false);
        setShowDropdown(false);
        setTimeout(() => {
          onDateRangeChange(todayStr, todayStr);
        }, 0);
        break;
      }

      case 'all': {
        setCustomRange(false);
        setShowDropdown(false);
        setTimeout(() => {
          onDateRangeChange('', '');
        }, 0);
        break;
      }

      case 'this-month': {
        const monthStart = format(startOfMonth(todayDate), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(todayDate), 'yyyy-MM-dd');
        setStartDate(monthStart);
        setEndDate(monthEnd);
        setCustomRange(false);
        setShowDropdown(false);
        setTimeout(() => {
          onDateRangeChange(monthStart, monthEnd);
        }, 0);
        break;
      }

      case 'last-month': {
        const lastMonth = subMonths(todayDate, 1);
        const lastMonthStart = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        const lastMonthEnd = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        setStartDate(lastMonthStart);
        setEndDate(lastMonthEnd);
        setCustomRange(false);
        setShowDropdown(false);
        setTimeout(() => {
          onDateRangeChange(lastMonthStart, lastMonthEnd);
        }, 0);
        break;
      }

      case 'last-3-months': {
        const threeMonthsAgo = subMonths(todayDate, 3);
        const threeMonthStart = format(startOfMonth(threeMonthsAgo), 'yyyy-MM-dd');
        const todayEnd = format(endOfMonth(todayDate), 'yyyy-MM-dd');
        setStartDate(threeMonthStart);
        setEndDate(todayEnd);
        setCustomRange(false);
        setShowDropdown(false);
        setTimeout(() => {
          onDateRangeChange(threeMonthStart, todayEnd);
        }, 0);
        break;
      }

      case 'custom':
        setCustomRange(true);
        break;
    }
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate);
      setShowDropdown(false);
    }
  };

  const getDisplayText = () => {
    const preset = presets.find(p => p.id === selectedPreset);

    if (selectedPreset === 'custom' && startDate && endDate) {
      const start = format(new Date(startDate), 'dd/MM/yyyy');
      const end = format(new Date(endDate), 'dd/MM/yyyy');
      return start === end ? start : `${start} - ${end}`;
    }

    if (selectedPreset === 'today' && startDate) {
      const dateStr = format(new Date(startDate), 'dd/MM/yyyy');
      return `${getPresetLabel('today')} (${dateStr})`;
    }

    if (selectedPreset === 'this-month') {
      const monthYear = format(new Date(), 'MMMM yyyy', { locale });
      return `${getPresetLabel('this-month')} (${monthYear})`;
    }

    if (preset) return getPresetLabel(preset.id);

    return isEn ? 'Select Date Range' : 'Pilih Rentang Tanggal';
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 bg-gradient-to-r from-white to-slate-50 border-2 border-emerald-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all duration-200 active:scale-98 group"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold text-slate-700 truncate">
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-emerald-600 flex-shrink-0 group-hover:translate-y-0.5 transition-transform" />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute left-0 sm:right-0 mt-2 w-full sm:w-80 bg-white rounded-xl shadow-2xl border-2 border-slate-200 z-20 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 border-b border-emerald-100">
              <p className="text-sm font-semibold text-slate-700">
                {isEn ? 'Select Period' : 'Pilih Periode'}
              </p>
            </div>
            <div className="p-3 space-y-1">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                    selectedPreset === preset.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-md scale-[1.02]'
                      : 'hover:bg-slate-100 text-slate-700 font-medium hover:scale-[1.01]'
                  }`}
                >
                  <span className="text-lg">{preset.icon}</span>
                  <span className="text-sm">{getPresetLabel(preset.id)}</span>
                  {selectedPreset === preset.id && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>

            {customRange && (
              <div className="border-t border-slate-200 p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {isEn ? 'From Date' : 'Dari Tanggal'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {isEn ? 'To Date' : 'Sampai Tanggal'}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleCustomApply}
                  disabled={!startDate || !endDate}
                  className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isEn ? 'Apply' : 'Terapkan'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
