import { useState, useEffect } from 'react';
import { supabase, Transaction, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { StatsCard } from './StatsCard';
import { FilterBar } from './FilterBar';
import { DateRangePicker } from './DateRangePicker';
import { CompactExportDropdown } from './CompactExportDropdown';
import { CategoryManager } from './CategoryManager';
import { QuickTransactionButton } from './QuickTransactionButton';

export function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useSettings(); // ⬅️ ambil language juga

  // === DATA STATE ===
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSavings, setTotalSavings] = useState(0);
  const [monthlySavingsAmount, setMonthlySavingsAmount] = useState(0);
  const [totalKasbon, setTotalKasbon] = useState(0);

  // === UI STATE ===
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    type: '',
    startDate: '',
    endDate: ''
  });

  // locale utk tanggal sesuai bahasa
  const locale = language === 'en' ? 'en-US' : 'id-ID';

  // Load awal
  useEffect(() => {
    loadCategories();
    loadTransactions();
    loadSavingsData();
    loadKasbonData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filter setiap kali filters / allTransactions berubah
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, allTransactions]);

  const loadCategories = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${user.id}`)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
  };

  const loadTransactions = async () => {
    if (!user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAllTransactions(data as Transaction[]);
    }

    setLoading(false);
  };

  const loadSavingsData = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('savings_goals')
      .select('current_amount, created_at')
      .eq('user_id', user.id);

    if (!error && data) {
      const total = data.reduce((sum, goal) => sum + Number(goal.current_amount), 0);
      setTotalSavings(total);

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: monthlyTransactions, error: txError } = await supabase
        .from('savings_transactions')
        .select('amount, type, date')
        .eq('user_id', user.id)
        .gte('date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0]);

      if (!txError && monthlyTransactions) {
        const monthlyAmount = monthlyTransactions.reduce((sum, tx) => {
          if (tx.type === 'deposit') {
            return sum + Number(tx.amount);
          } else {
            return sum - Number(tx.amount);
          }
        }, 0);
        setMonthlySavingsAmount(monthlyAmount);
      }
    }
  };

  const loadKasbonData = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('kasbon')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'unpaid');

    if (!error && data) {
      const total = data.reduce((sum, kasbon) => sum + Number(kasbon.amount), 0);
      setTotalKasbon(total);
    }
  };

  const applyFilters = () => {
    let filteredData = [...allTransactions];

    if (filters.categoryId) {
      filteredData = filteredData.filter(
        (t) => t.category_id === filters.categoryId
      );
    }

    if (filters.type) {
      filteredData = filteredData.filter((t) => t.type === filters.type);
    }

    if (filters.startDate) {
      filteredData = filteredData.filter(
        (t) => t.transaction_date >= filters.startDate
      );
    }

    if (filters.endDate) {
      filteredData = filteredData.filter(
        (t) => t.transaction_date <= filters.endDate
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(
        (t) =>
          t.title.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower)
      );
    }

    setTransactions(filteredData);
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters((prev) => ({ ...prev, startDate, endDate }));
  };

  const handleTransactionSaved = () => {
    loadTransactions();
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const message =
      language === 'en'
        ? 'Are you sure you want to delete this transaction?'
        : 'Yakin ingin menghapus transaksi ini?';

    if (!confirm(message)) return;

    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (!error) {
      loadTransactions();
    }
  };

  // ====== HELPER FORMAT PERIODE UNTUK KARTU HARI INI / FILTER ======
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFilterPeriodLabel = () => {
    const { startDate, endDate } = filters;

    if (startDate && endDate) {
      if (startDate === endDate) {
        // Per / As of
        return language === 'en'
          ? `As of ${formatDate(startDate)}`
          : `Per ${formatDate(startDate)}`;
      }
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    if (startDate)
      return language === 'en'
        ? `Since ${formatDate(startDate)}`
        : `Sejak ${formatDate(startDate)}`;

    if (endDate)
      return language === 'en'
        ? `Until ${formatDate(endDate)}`
        : `Sampai ${formatDate(endDate)}`;

    // default: hari ini
    const today = new Date();
    const todayStr = today.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return language === 'en' ? `As of ${todayStr}` : `Per ${todayStr}`;
  };

  // ====== PERHITUNGAN STATISTIK ======

  // 1. Saldo bulan ini (selalu dari ALL transactions)
  const calculateCurrentMonthStats = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonth = firstDayOfMonth.toISOString().split('T')[0];
    const endOfToday = today.toISOString().split('T')[0];

    const monthlyTransactions = allTransactions.filter(
      (t) =>
        t.transaction_date >= startOfMonth &&
        t.transaction_date <= endOfToday
    );

    return monthlyTransactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += Number(t.amount);
        } else {
          acc.expense += Number(t.amount);
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  };

  // 2. Saldo keseluruhan (all-time)
  const calculateOverallBalance = () => {
    return allTransactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += Number(t.amount);
        } else {
          acc.expense += Number(t.amount);
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  };

  // 3. Statistik sesuai filter tanggal (buat kartu Pemasukan / Pengeluaran & Export)
  const calculateFilteredStats = () => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += Number(t.amount);
        } else {
          acc.expense += Number(t.amount);
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  };

  const monthlyStats = calculateCurrentMonthStats();
  const monthlyBalance = monthlyStats.income - monthlyStats.expense - monthlySavingsAmount - totalKasbon;

  const overallStats = calculateOverallBalance();
  const overallBalance = overallStats.income - overallStats.expense - totalSavings - totalKasbon;

  const stats = calculateFilteredStats();
  const balance = stats.income - stats.expense;

  const todaySubtitle = new Date().toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          <CompactExportDropdown
            transactions={transactions}
            categories={categories}
            stats={{ ...stats, balance }}
            currentFilters={{
              startDate: filters.startDate,
              endDate: filters.endDate
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Saldo Bulan Ini – Month-to-date */}
        <StatsCard
          title={
            language === 'en'
              ? 'This Month Balance'
              : 'Saldo Bulan Ini'
          }
          subtitle={
            language === 'en'
              ? `As of ${todaySubtitle}`
              : `Per ${todaySubtitle}`
          }
          description={
            language === 'en'
              ? 'Net balance for the current month (income - expense - savings - loans). Automatically resets every 1st of the month.'
              : 'Saldo bersih untuk bulan berjalan (pemasukan - pengeluaran - tabungan - kasbon). Data otomatis reset setiap tanggal 1.'
          }
          amount={monthlyBalance}
          icon={Wallet}
          color="blue"
          highlight={true}
        />

        {/* Saldo Keseluruhan – All-time */}
        <StatsCard
          title={
            language === 'en'
              ? 'Overall Balance'
              : 'Saldo Keseluruhan'
          }
          subtitle={
            language === 'en'
              ? 'All-time Balance'
              : 'Saldo Sejak Awal'
          }
          description={
            language === 'en'
              ? 'Total income and expenses since you first used the app (minus savings and loans). Not affected by date filters.'
              : 'Total seluruh pemasukan dan pengeluaran sejak pertama kali menggunakan aplikasi (dikurangi tabungan dan kasbon). Tidak terpengaruh filter tanggal.'
          }
          amount={overallBalance}
          icon={Wallet}
          color="purple"
          highlight={false}
        />

        {/* Total Savings */}
        <StatsCard
          title={t('totalSavings')}
          subtitle={
            language === 'en'
              ? 'Total Saved'
              : 'Total Ditabung'
          }
          description={
            language === 'en'
              ? 'Total amount saved across all savings goals. Click Savings menu to manage your goals.'
              : 'Total jumlah yang telah ditabung di semua target. Klik menu Menabung untuk kelola target Anda.'
          }
          amount={totalSavings}
          icon={PiggyBank}
          color="emerald"
          highlight={false}
        />

        {/* Pemasukan – sesuai tanggal (default: hari ini / filter) */}
        <StatsCard
          title={
            language === 'en'
              ? 'Income'
              : 'Pemasukan'
          }
          subtitle={getFilterPeriodLabel()}
          description={
            language === 'en'
              ? 'Total income for the selected period (default: today).'
              : 'Total semua pemasukan sesuai tanggal yang dipilih (default: hari ini).'
          }
          amount={stats.income}
          icon={TrendingUp}
          color="green"
          highlight={false}
        />

        {/* Pengeluaran – sesuai tanggal (default: hari ini / filter) */}
        <StatsCard
          title={
            language === 'en'
              ? 'Expenses'
              : 'Pengeluaran'
          }
          subtitle={getFilterPeriodLabel()}
          description={
            language === 'en'
              ? 'Total expenses for the selected period (default: today).'
              : 'Total semua pengeluaran sesuai tanggal yang dipilih (default: hari ini).'
          }
          amount={stats.expense}
          icon={TrendingDown}
          color="red"
          highlight={false}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
            {t('transactions')}
          </h2>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-98"
          >
            <Plus className="w-5 h-5" />
            <span>{t('addTransaction')}</span>
          </button>
        </div>

        <FilterBar
          filters={filters}
          categories={categories}
          onFilterChange={setFilters}
        />

        <TransactionList
          transactions={transactions}
          categories={categories}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onSave={handleTransactionSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onCategoriesUpdate={loadCategories}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      <QuickTransactionButton
        onClick={() => {
          setEditingTransaction(null);
          setShowForm(true);
        }}
      />
    </div>
  );
}
