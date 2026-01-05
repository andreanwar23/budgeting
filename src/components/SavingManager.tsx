import { useState, useEffect } from 'react';
import { PiggyBank, Plus, X, TrendingUp, TrendingDown, Pencil, Trash2, ArrowLeft, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { CurrencyInput } from './CurrencyInput';
import { format } from 'date-fns';

interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface SavingsTransaction {
  id: string;
  goal_id: string;
  user_id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  note?: string;
  created_at: string;
}

interface GoalFormData {
  name: string;
  target_amount: string;
  start_date: string;
  target_date: string;
  notes: string;
}

interface TransactionFormData {
  amount: string;
  date: string;
  note: string;
}

type ViewMode = 'list' | 'add-goal' | 'edit-goal' | 'goal-detail';

export function SavingManager() {
  const { user } = useAuth();
  const { currency, formatCurrency, t } = useSettings();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState<'deposit' | 'withdraw' | null>(null);

  const [goalFormData, setGoalFormData] = useState<GoalFormData>({
    name: '',
    target_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    target_date: '',
    notes: ''
  });

  const [transactionFormData, setTransactionFormData] = useState<TransactionFormData>({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGoals(data);
    }
  };

  const loadTransactions = async (goalId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('savings_transactions')
      .select('*')
      .eq('goal_id', goalId)
      .order('date', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const goalData: any = {
      user_id: user.id,
      name: goalFormData.name,
      target_amount: parseFloat(goalFormData.target_amount),
      start_date: goalFormData.start_date,
      target_date: goalFormData.target_date || null,
      notes: goalFormData.notes || null
    };

    if (viewMode === 'edit-goal' && selectedGoal) {
      const { error } = await supabase
        .from('savings_goals')
        .update(goalData)
        .eq('id', selectedGoal.id);

      if (!error) {
        await loadGoals();
        setViewMode('list');
        resetGoalForm();
      }
    } else {
      const { error } = await supabase
        .from('savings_goals')
        .insert([goalData]);

      if (!error) {
        await loadGoals();
        setViewMode('list');
        resetGoalForm();
      }
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGoal || !showTransactionForm) return;

    const amount = parseFloat(transactionFormData.amount);

    if (showTransactionForm === 'withdraw' && amount > selectedGoal.current_amount) {
      alert(t('withdrawalExceeds'));
      return;
    }

    if (amount <= 0) {
      alert(t('invalidAmount'));
      return;
    }

    const transactionData = {
      goal_id: selectedGoal.id,
      user_id: user.id,
      type: showTransactionForm,
      amount: amount,
      date: transactionFormData.date,
      note: transactionFormData.note || null
    };

    const { error } = await supabase
      .from('savings_transactions')
      .insert([transactionData]);

    if (!error) {
      await loadGoals();
      await loadTransactions(selectedGoal.id);

      const updatedGoal = goals.find(g => g.id === selectedGoal.id);
      if (updatedGoal) {
        setSelectedGoal(updatedGoal);
      }

      setShowTransactionForm(null);
      resetTransactionForm();
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm(t('confirmDeleteGoal'))) return;

    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goalId);

    if (!error) {
      await loadGoals();
      if (selectedGoal?.id === goalId) {
        setViewMode('list');
        setSelectedGoal(null);
      }
    }
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setGoalFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      start_date: goal.start_date,
      target_date: goal.target_date || '',
      notes: goal.notes || ''
    });
    setViewMode('edit-goal');
  };

  const handleViewGoalDetail = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    loadTransactions(goal.id);
    setViewMode('goal-detail');
  };

  const resetGoalForm = () => {
    setGoalFormData({
      name: '',
      target_amount: '',
      start_date: new Date().toISOString().split('T')[0],
      target_date: '',
      notes: ''
    });
    setSelectedGoal(null);
  };

  const resetTransactionForm = () => {
    setTransactionFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
  };

  const calculateProgress = (current: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const totalSavings = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const overallProgress = calculateProgress(totalSavings, totalTarget);

  if (viewMode === 'add-goal' || viewMode === 'edit-goal') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {viewMode === 'add-goal' ? t('addGoal') : t('editGoal')}
              </h2>
              <button
                onClick={() => {
                  setViewMode('list');
                  resetGoalForm();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('goalName')}
                </label>
                <input
                  type="text"
                  required
                  value={goalFormData.name}
                  onChange={(e) => setGoalFormData({ ...goalFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder={t('goalNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('targetAmount')} ({currency === 'IDR' ? 'Rp' : '$'})
                </label>
                <CurrencyInput
                  value={goalFormData.target_amount}
                  onChange={(value) => setGoalFormData({ ...goalFormData, target_amount: value })}
                  currency={currency}
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('startDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={goalFormData.start_date}
                    onChange={(e) => setGoalFormData({ ...goalFormData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('targetDateOptional')}
                  </label>
                  <input
                    type="date"
                    value={goalFormData.target_date}
                    onChange={(e) => setGoalFormData({ ...goalFormData, target_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('notesOptional')}
                </label>
                <textarea
                  value={goalFormData.notes}
                  onChange={(e) => setGoalFormData({ ...goalFormData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  rows={3}
                  placeholder={t('notesPlaceholder')}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list');
                    resetGoalForm();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'goal-detail' && selectedGoal) {
    const progress = calculateProgress(selectedGoal.current_amount, selectedGoal.target_amount);
    const remaining = selectedGoal.target_amount - selectedGoal.current_amount;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('savingsGoals')}
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {selectedGoal.name}
                </h2>
                {selectedGoal.notes && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{selectedGoal.notes}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditGoal(selectedGoal)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteGoal(selectedGoal.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">{t('progress')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('currentAmount')}</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedGoal.current_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('targetAmount')}</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(selectedGoal.target_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('remaining')}</div>
                  <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {formatCurrency(remaining)}
                  </div>
                </div>
                {selectedGoal.target_date && (
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('targetDate')}</div>
                    <div className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                      {format(new Date(selectedGoal.target_date), 'dd MMM yyyy')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowTransactionForm('deposit')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                <TrendingUp className="w-5 h-5" />
                {t('addDeposit')}
              </button>
              <button
                onClick={() => setShowTransactionForm('withdraw')}
                disabled={selectedGoal.current_amount === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <TrendingDown className="w-5 h-5" />
                {t('addWithdrawal')}
              </button>
            </div>
          </div>

          {showTransactionForm && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {showTransactionForm === 'deposit' ? t('addDeposit') : t('addWithdrawal')}
                </h3>
                <button
                  onClick={() => {
                    setShowTransactionForm(null);
                    resetTransactionForm();
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {showTransactionForm === 'deposit' ? t('depositAmount') : t('withdrawAmount')} ({currency === 'IDR' ? 'Rp' : '$'})
                  </label>
                  <CurrencyInput
                    value={transactionFormData.amount}
                    onChange={(value) => setTransactionFormData({ ...transactionFormData, amount: value })}
                    currency={currency}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={transactionFormData.date}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {showTransactionForm === 'deposit' ? t('depositNote') : t('withdrawNote')}
                  </label>
                  <input
                    type="text"
                    value={transactionFormData.note}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, note: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder={t('notesOptional')}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransactionForm(null);
                      resetTransactionForm();
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    {t('save')}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {t('transactionHistory')}
            </h3>

            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400">{t('noTransactions')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'deposit'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {transaction.type === 'deposit' ? t('deposit') : t('withdraw')}
                        </div>
                        {transaction.note && (
                          <div className="text-sm text-slate-600 dark:text-slate-400">{transaction.note}</div>
                        )}
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          {format(new Date(transaction.date), 'dd MMM yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      transaction.type === 'deposit'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <PiggyBank className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('savings')}</h1>
              <p className="text-slate-600 dark:text-slate-400">{t('savingsGoals')}</p>
            </div>
          </div>
          <button
            onClick={() => setViewMode('add-goal')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            <Plus className="w-5 h-5" />
            {t('addGoal')}
          </button>
        </div>

        {goals.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('overall')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">{t('totalSavings')}</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalSavings)}
                </div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">{t('totalTarget')}</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalTarget)}
                </div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-sm text-orange-700 dark:text-orange-400 mb-1">{t('remaining')}</div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(Math.max(0, totalTarget - totalSavings))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-400">{t('progress')} {t('overall')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{overallProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{t('noGoals')}</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{t('noGoalsMessage')}</p>
            <button
              onClick={() => setViewMode('add-goal')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              <Plus className="w-5 h-5" />
              {t('addGoal')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const progress = calculateProgress(goal.current_amount, goal.target_amount);
              const remaining = goal.target_amount - goal.current_amount;

              return (
                <div
                  key={goal.id}
                  onClick={() => handleViewGoalDetail(goal)}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    {goal.name}
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-400">{t('progress')}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{t('currentAmount')}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(goal.current_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{t('targetAmount')}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(goal.target_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">{t('remaining')}</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
