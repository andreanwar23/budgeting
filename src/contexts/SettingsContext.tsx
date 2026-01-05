import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Language = 'en' | 'id';
export type Currency = 'USD' | 'IDR';
export type Theme = 'light' | 'dark';

interface UserSettings {
  id: string;
  user_id: string;
  language: Language;
  currency: Currency;
  theme: Theme;
  created_at: string;
  updated_at: string;
}

interface SettingsContextType {
  language: Language;
  currency: Currency;
  theme: Theme;
  loading: boolean;
  setLanguage: (language: Language) => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  formatCurrency: (amount: number) => string;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    categories: 'Categories',
    kasbon: 'Loans',
    savings: 'Savings',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    // Transaction Types
    income: 'Income',
    expense: 'Expense',
    // Balance & Stats
    balance: 'Balance',
    thisMonth: 'This Month',
    overall: 'Overall Balance',
    allTime: 'All-Time Balance',
    monthlyBalance: 'Monthly Balance',
    totalBalance: 'Total Balance',
    monthlyIncome: 'Monthly Income',
    monthlyExpense: 'Monthly Expense',
    // Actions
    addTransaction: 'Add Transaction',
    editTransaction: 'Edit Transaction',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    clearFilter: 'Clear Filter',
    // Form Fields
    transactionType: 'Transaction Type',
    title: 'Title',
    amount: 'Amount',
    description: 'Description',
    descriptionOptional: 'Description (Optional)',
    date: 'Date',
    category: 'Category',
    allCategories: 'All Categories',
    allTypes: 'All Types',
    fromDate: 'From Date',
    toDate: 'To Date',
    // Placeholders
    searchPlaceholder: 'Search by title or description...',
    titlePlaceholder: 'Example: Lunch',
    descriptionPlaceholder: 'Add notes...',
    // Messages
    loading: 'Loading...',
    noData: 'No data available',
    confirmDelete: 'Are you sure you want to delete this?',
    errorOccurred: 'An error occurred',
    fillThisField: 'Please fill out this field.',
    // User
    activeUser: 'Active User',
    // App Info
    appName: 'BU',
    appFullName: 'Budgeting Uang',
    // Categories
    addCategory: 'Add Category',
    categoryName: 'Category Name',
    selectIcon: 'Select Icon',
    myCategories: 'My Categories',
    // Theme
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    // Date periods
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    customRange: 'Custom Range',
    // Others
    active: 'Active',
    per: 'As of',
    since: 'Since',
    until: 'Until',
    language: 'English',
    // Savings
    savingsGoal: 'Savings Goal',
    savingsGoals: 'Savings Goals',
    addGoal: 'Add Goal',
    editGoal: 'Edit Goal',
    goalName: 'Goal Name',
    targetAmount: 'Target Amount',
    currentAmount: 'Current Amount',
    startDate: 'Start Date',
    targetDate: 'Target Date',
    targetDateOptional: 'Target Date (Optional)',
    notes: 'Notes',
    notesOptional: 'Notes (Optional)',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    addDeposit: 'Add Deposit',
    addWithdrawal: 'Add Withdrawal',
    depositAmount: 'Deposit Amount',
    withdrawAmount: 'Withdrawal Amount',
    transactionHistory: 'Transaction History',
    totalSavings: 'Total Savings',
    totalTarget: 'Total Target',
    progress: 'Progress',
    remaining: 'Remaining',
    achieved: 'Achieved',
    noGoals: 'No savings goals yet',
    noGoalsMessage: 'Start your first savings goal',
    noTransactions: 'No transactions yet',
    confirmDeleteGoal: 'Delete this savings goal? This will also delete all related transactions.',
    confirmWithdraw: 'Are you sure you want to withdraw this amount?',
    withdrawalExceeds: 'Withdrawal amount exceeds current savings',
    invalidAmount: 'Please enter a valid amount',
    goalNamePlaceholder: 'Example: Vacation Fund',
    notesPlaceholder: 'Add some notes...',
    depositNote: 'Deposit note',
    withdrawNote: 'Withdrawal note',
    savingsBalance: 'Savings Balance',
    monthlySavings: 'Monthly Savings',
  },
  id: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transaksi',
    categories: 'Kategori',
    kasbon: 'Kasbon',
    savings: 'Menabung',
    reports: 'Laporan',
    settings: 'Pengaturan',
    logout: 'Keluar',
    // Transaction Types
    income: 'Pemasukan',
    expense: 'Pengeluaran',
    // Balance & Stats
    balance: 'Saldo',
    thisMonth: 'Bulan Ini',
    overall: 'Saldo Keseluruhan',
    allTime: 'All-Time Balance',
    monthlyBalance: 'Saldo Bulan Ini',
    totalBalance: 'Total Saldo',
    monthlyIncome: 'Pemasukan Bulan Ini',
    monthlyExpense: 'Pengeluaran Bulan Ini',
    // Actions
    addTransaction: 'Tambah Transaksi',
    editTransaction: 'Edit Transaksi',
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    edit: 'Edit',
    search: 'Cari',
    filter: 'Filter',
    export: 'Ekspor',
    clearFilter: 'Hapus Filter',
    // Form Fields
    transactionType: 'Tipe Transaksi',
    title: 'Judul',
    amount: 'Jumlah',
    description: 'Deskripsi',
    descriptionOptional: 'Deskripsi (Opsional)',
    date: 'Tanggal',
    category: 'Kategori',
    allCategories: 'Semua Kategori',
    allTypes: 'Semua Tipe',
    fromDate: 'Dari Tanggal',
    toDate: 'Sampai Tanggal',
    // Placeholders
    searchPlaceholder: 'Cari berdasarkan judul atau deskripsi...',
    titlePlaceholder: 'Contoh: Makan siang',
    descriptionPlaceholder: 'Tambahkan catatan...',
    // Messages
    loading: 'Memuat...',
    noData: 'Tidak ada data',
    confirmDelete: 'Yakin ingin menghapus ini?',
    errorOccurred: 'Terjadi kesalahan',
    fillThisField: 'Harap isi bidang ini.',
    // User
    activeUser: 'Pengguna Aktif',
    // App Info
    appName: 'BU',
    appFullName: 'Budgeting Uang',
    // Categories
    addCategory: 'Tambah Kategori',
    categoryName: 'Nama Kategori',
    selectIcon: 'Pilih Icon',
    myCategories: 'Kategori Saya',
    // Theme
    darkMode: 'Mode Gelap',
    lightMode: 'Mode Terang',
    // Date periods
    today: 'Hari Ini',
    yesterday: 'Kemarin',
    thisWeek: 'Minggu Ini',
    lastWeek: 'Minggu Lalu',
    last7Days: '7 Hari Terakhir',
    last30Days: '30 Hari Terakhir',
    customRange: 'Rentang Kustom',
    // Others
    active: 'Aktif',
    per: 'Per',
    since: 'Sejak',
    until: 'Sampai',
    language: 'Bahasa Indonesia',
    // Savings
    savingsGoal: 'Target Menabung',
    savingsGoals: 'Target Menabung',
    addGoal: 'Tambah Target',
    editGoal: 'Edit Target',
    goalName: 'Nama Target',
    targetAmount: 'Target Jumlah',
    currentAmount: 'Jumlah Saat Ini',
    startDate: 'Tanggal Mulai',
    targetDate: 'Tanggal Target',
    targetDateOptional: 'Tanggal Target (Opsional)',
    notes: 'Catatan',
    notesOptional: 'Catatan (Opsional)',
    deposit: 'Setor',
    withdraw: 'Tarik',
    addDeposit: 'Tambah Setoran',
    addWithdrawal: 'Tarik Dana',
    depositAmount: 'Jumlah Setoran',
    withdrawAmount: 'Jumlah Penarikan',
    transactionHistory: 'Riwayat Transaksi',
    totalSavings: 'Total Tabungan',
    totalTarget: 'Total Target',
    progress: 'Progres',
    remaining: 'Tersisa',
    achieved: 'Tercapai',
    noGoals: 'Belum ada target menabung',
    noGoalsMessage: 'Mulai target menabung pertama Anda',
    noTransactions: 'Belum ada transaksi',
    confirmDeleteGoal: 'Hapus target menabung ini? Semua transaksi terkait juga akan dihapus.',
    confirmWithdraw: 'Yakin ingin menarik dana sebesar ini?',
    withdrawalExceeds: 'Jumlah penarikan melebihi tabungan saat ini',
    invalidAmount: 'Harap masukkan jumlah yang valid',
    goalNamePlaceholder: 'Contoh: Dana Liburan',
    notesPlaceholder: 'Tambahkan catatan...',
    depositNote: 'Catatan setoran',
    withdrawNote: 'Catatan penarikan',
    savingsBalance: 'Saldo Tabungan',
    monthlySavings: 'Tabungan Bulan Ini',
  },
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('id');
  const [currency, setCurrencyState] = useState<Currency>('IDR');
  const [theme, setThemeState] = useState<Theme>('light');
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setLanguageState('id');
      setCurrencyState('IDR');
      setThemeState('light');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const loadSettings = async () => {
    if (!user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setLanguageState(data.language as Language);
      setCurrencyState(data.currency as Currency);
      setThemeState(data.theme as Theme);
      setSettingsId(data.id);
    } else if (!data) {
      await createDefaultSettings();
    }

    setLoading(false);
  };

  const createDefaultSettings = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_settings')
      .insert([
        {
          user_id: user.id,
          language: 'id',
          currency: 'IDR',
          theme: 'light',
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setSettingsId(data.id);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user?.id) return;

    if (settingsId) {
      await supabase
        .from('user_settings')
        .update(updates)
        .eq('id', settingsId);
    } else {
      // Create settings with the updates included
      const { data, error } = await supabase
        .from('user_settings')
        .insert([
          {
            user_id: user.id,
            language: updates.language || language,
            currency: updates.currency || currency,
            theme: updates.theme || theme,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        setSettingsId(data.id);
      }
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    await updateSettings({ language: newLanguage });
  };

  const setCurrency = async (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    await updateSettings({ currency: newCurrency });
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await updateSettings({ theme: newTheme });
  };

  const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);

    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } else {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const value = {
    language,
    currency,
    theme,
    loading,
    setLanguage,
    setCurrency,
    setTheme,
    formatCurrency,
    t,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
