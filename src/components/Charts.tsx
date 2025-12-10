import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { supabase, Category, Transaction } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { CategoryDetailPanel } from './CategoryDetailPanel';
import { CompactExportDropdown } from './CompactExportDropdown';

export function Charts() {
  const { user } = useAuth();
  const { language, currency } = useSettings();
  const isEn = language === 'en';
  const locale = isEn ? 'en-US' : 'id-ID';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // State for category detail panel
  const [selectedCategory, setSelectedCategory] = useState<{
    name: string;
    type: 'income' | 'expense';
    transactions: Transaction[];
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadCategories();
      loadTransactions();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateRange]);

  const loadCategories = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${user.id}`);

    if (!error && data) {
      setCategories(data);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select(
          `
          *,
          category:categories(*)
        `
        )
        .eq('user_id', user.id);

      if (dateRange.startDate && dateRange.endDate) {
        query = query
          .gte('transaction_date', dateRange.startDate)
          .lte('transaction_date', dateRange.endDate);
      }

      const { data, error } = await query.order('transaction_date', {
        ascending: true
      });

      if (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
      } else if (data) {
        setTransactions(data as Transaction[]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const formatCurrency = (value: number) => {
    const fractionDigits = currency === 'USD' ? 2 : 0;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(value);
  };

  const categoryData = useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    transactions.forEach((t) => {
      const categoryName =
        t.category?.name || (isEn ? 'Others' : 'Lainnya');
      if (t.type === 'income') {
        incomeByCategory[categoryName] =
          (incomeByCategory[categoryName] || 0) + Number(t.amount);
      } else {
        expenseByCategory[categoryName] =
          (expenseByCategory[categoryName] || 0) + Number(t.amount);
      }
    });

    const incomeData = Object.entries(incomeByCategory).map(
      ([name, value]) => ({
        name,
        value,
        percentage: 0
      })
    );

    const expenseData = Object.entries(expenseByCategory).map(
      ([name, value]) => ({
        name,
        value,
        percentage: 0
      })
    );

    const totalIncome = incomeData.reduce(
      (sum, item) => sum + item.value,
      0
    );
    const totalExpense = expenseData.reduce(
      (sum, item) => sum + item.value,
      0
    );

    incomeData.forEach((item) => {
      item.percentage = totalIncome > 0 ? (item.value / totalIncome) * 100 : 0;
    });

    expenseData.forEach((item) => {
      item.percentage =
        totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
    });

    return { incomeData, expenseData, totalIncome, totalExpense };
  }, [transactions, isEn]);

  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { income: number; expense: number; date: string }
    > = {};

    transactions.forEach((t) => {
      const date = t.transaction_date;
      if (!dailyData[date]) {
        dailyData[date] = { date, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dailyData[date].income += Number(t.amount);
      } else {
        dailyData[date].expense += Number(t.amount);
      }
    });

    return Object.values(dailyData).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [transactions]);

  const COLORS = [
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316'
  ];

  const handleCategoryClick = (
    categoryName: string,
    type: 'income' | 'expense'
  ) => {
    try {
      if (!categoryName) {
        console.warn('Category name is empty');
        return;
      }

      const categoryTransactions = transactions.filter((t) => {
        const matchesCategory = t.category?.name === categoryName;
        const matchesType = t.type === type;

        if (dateRange.startDate && dateRange.endDate) {
          const matchesDate =
            t.transaction_date >= dateRange.startDate &&
            t.transaction_date <= dateRange.endDate;
          return matchesCategory && matchesType && matchesDate;
        }

        return matchesCategory && matchesType;
      });

      const totalAmount = categoryTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      if (categoryTransactions.length > 0) {
        setSelectedCategory({
          name: categoryName,
          type,
          transactions: categoryTransactions as Transaction[],
          totalAmount
        });
      } else {
        console.info(
          `No transactions found for category: ${categoryName}`
        );
      }
    } catch (error) {
      console.error('Error handling category click:', error);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-slate-400 mb-4">
            <svg
              className="w-20 h-20 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {isEn ? 'Login Required' : 'Login Diperlukan'}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isEn
              ? 'Please log in to view your financial reports.'
              : 'Silakan login terlebih dahulu untuk melihat laporan keuangan'}
          </p>
        </div>
      </div>
    );
  }

  // Initial loading
  if (loading && !initialLoadComplete) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {isEn ? 'Loading report...' : 'Memuat laporan...'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state (no transactions yet)
  if (initialLoadComplete && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {isEn ? 'Reports & Analysis' : 'Laporan & Analisis'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {isEn
                ? 'Visualize your finances'
                : 'Visualisasi keuangan Anda'}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border-2 border-dashed border-blue-200 dark:border-slate-600 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
              {isEn ? 'No Transactions Yet' : 'Belum Ada Transaksi'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {isEn
                ? 'Reports and charts will appear here after you add your first transaction. Start tracking your income or expenses now!'
                : 'Laporan dan grafik akan muncul di sini setelah Anda menambahkan transaksi pertama. Mulai catat pemasukan atau pengeluaran Anda sekarang!'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => (window.location.hash = '#dashboard')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {isEn ? 'Add Transaction' : 'Tambah Transaksi'}
              </button>
            </div>
            <div className="mt-8 pt-8 border-t border-blue-200 dark:border-slate-600">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 font-medium">
                {isEn
                  ? '💡 Tips: Start by recording'
                  : '💡 Tips: Mulai dengan mencatat'}
              </p>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                    {isEn ? 'Income' : 'Pemasukan'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {isEn
                      ? 'Salary, bonus, or other income'
                      : 'Gaji, bonus, atau pendapatan lainnya'}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="text-rose-600 dark:text-rose-400 font-semibold mb-1">
                    {isEn ? 'Expenses' : 'Pengeluaran'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {isEn
                      ? 'Shopping, bills, or other costs'
                      : 'Belanja, tagihan, atau biaya lainnya'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main charts layout
  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isEn ? 'Reports & Analysis' : 'Laporan & Analisis'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {isEn
              ? 'Visualize your finances'
              : 'Visualisasi keuangan Anda'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <DateRangePicker
            onDateRangeChange={(start, end) =>
              setDateRange({ startDate: start, endDate: end })
            }
          />
          <CompactExportDropdown
            transactions={transactions}
            categories={categories}
            stats={{
              income: categoryData.totalIncome,
              expense: categoryData.totalExpense,
              balance:
                categoryData.totalIncome - categoryData.totalExpense
            }}
            currentFilters={{
              startDate: dateRange.startDate,
              endDate: dateRange.endDate
            }}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
            {isEn ? 'Total Income' : 'Total Pemasukan'}
          </p>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300 mt-1">
            {formatCurrency(categoryData.totalIncome)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 p-6 rounded-xl border border-rose-200 dark:border-rose-800">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-rose-500 p-2 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">
            {isEn ? 'Total Expenses' : 'Total Pengeluaran'}
          </p>
          <p className="text-2xl font-bold text-rose-900 dark:text-rose-300 mt-1">
            {formatCurrency(categoryData.totalExpense)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-500 p-2 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
            {isEn ? 'Net Balance' : 'Saldo Bersih'}
          </p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
            {formatCurrency(
              categoryData.totalIncome - categoryData.totalExpense
            )}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-500 p-2 rounded-lg">
              <PieIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">
            {isEn ? 'Transactions' : 'Transaksi'}
          </p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">
            {transactions.length}
          </p>
        </div>
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by category */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {isEn ? 'Income by Category' : 'Pemasukan per Kategori'}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
              💡 {isEn ? 'Click for details' : 'Klik untuk detail'}
            </span>
          </div>
          {categoryData.incomeData.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              {isEn ? 'No income data yet' : 'Belum ada data pemasukan'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData.incomeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => {
                    const item = categoryData.incomeData.find(
                      (d) => d.name === entry.name
                    );
                    const percentage = item
                      ? item.percentage
                      : (entry.percent || 0) * 100;
                    return `${entry.name}: ${percentage.toFixed(1)}%`;
                  }}
                  onClick={(data) =>
                    handleCategoryClick(data.name, 'income')
                  }
                  cursor="pointer"
                >
                  {categoryData.incomeData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {data.name}
                          </p>
                          <p className="text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(data.value)}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {data.percentage.toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {isEn
                              ? 'Click for details →'
                              : 'Klik untuk detail →'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense by category */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              {isEn ? 'Expenses by Category' : 'Pengeluaran per Kategori'}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
              💡 {isEn ? 'Click for details' : 'Klik untuk detail'}
            </span>
          </div>
          {categoryData.expenseData.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              {isEn ? 'No expense data yet' : 'Belum ada data pengeluaran'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData.expenseData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => {
                    const item = categoryData.expenseData.find(
                      (d) => d.name === entry.name
                    );
                    const percentage = item
                      ? item.percentage
                      : (entry.percent || 0) * 100;
                    return `${entry.name}: ${percentage.toFixed(1)}%`;
                  }}
                  onClick={(data) =>
                    handleCategoryClick(data.name, 'expense')
                  }
                  cursor="pointer"
                >
                  {categoryData.expenseData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {data.name}
                          </p>
                          <p className="text-rose-600 dark:text-rose-400">
                            {formatCurrency(data.value)}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {data.percentage.toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {isEn
                              ? 'Click for details →'
                              : 'Klik untuk detail →'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily trend */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          {isEn ? 'Daily Trend' : 'Tren Harian'}
        </h3>
        {dailyTrend.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            {isEn
              ? 'No transaction data yet'
              : 'Belum ada data transaksi'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString(locale, {
                    day: '2-digit',
                    month: 'short'
                  })
                }
              />
              <YAxis
                tickFormatter={(value) =>
                  `${(value / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString(locale)
                }
              />
              <Legend />
              <Bar
                dataKey="income"
                fill="#10b981"
                name={isEn ? 'Income' : 'Pemasukan'}
              />
              <Bar
                dataKey="expense"
                fill="#ef4444"
                name={isEn ? 'Expenses' : 'Pengeluaran'}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top expense categories bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          {isEn
            ? 'Category Comparison (Click for details)'
            : 'Perbandingan Kategori (Klik untuk detail)'}
        </h3>
        {categoryData.expenseData.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            {isEn ? 'No data to display yet' : 'Belum ada data untuk ditampilkan'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={[...categoryData.expenseData]
                .sort((a, b) => b.value - a.value)
                .slice(0, 10)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                tickFormatter={(value) =>
                  `${(value / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {data.name}
                        </p>
                        <p className="text-rose-600 dark:text-rose-400">
                          {formatCurrency(data.value)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {isEn
                            ? 'Click for details →'
                            : 'Klik untuk detail →'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="value"
                fill="#8b5cf6"
                name={isEn ? 'Expenses' : 'Pengeluaran'}
                onClick={(data) =>
                  handleCategoryClick(
                    data.name || (isEn ? 'Unknown' : 'Tidak diketahui'),
                    'expense'
                  )
                }
                cursor="pointer"
                style={{ touchAction: 'manipulation' }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Detail Panel */}
      {selectedCategory && (
        <CategoryDetailPanel
          categoryName={selectedCategory.name}
          categoryType={selectedCategory.type}
          transactions={selectedCategory.transactions}
          categories={categories}
          totalAmount={selectedCategory.totalAmount}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  );
}
