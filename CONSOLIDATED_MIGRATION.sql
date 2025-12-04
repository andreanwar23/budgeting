/*
  # Complete Financial Management System Database Schema

  ## Overview
  This consolidated migration combines all database tables required for the
  complete financial management system. It creates tables for transactions,
  categories, kasbon (loans/debts), user settings, and user profiles with
  full security (RLS) and performance optimizations.

  ## Database Type
  PostgreSQL (Supabase)

  ## Tables Created

  ### 1. categories
  - Stores transaction categories (both default and user-created)
  - Fields: id, user_id, name, type, is_default, icon, created_at, updated_at
  - Supports both income and expense categories
  - Pre-populated with 14 default categories

  ### 2. transactions
  - Stores all financial transactions
  - Fields: id, user_id, amount, type, category_id, title, description,
           transaction_date, created_at, updated_at
  - Links to categories table via foreign key

  ### 3. kasbon
  - Stores loan/debt records (hutang/piutang)
  - Fields: id, user_id, name, amount, type, status, due_date, notes,
           created_at, updated_at
  - Tracks both money owed (hutang) and money lent (piutang)

  ### 4. user_settings
  - Stores user preferences and configuration
  - Fields: id, user_id, language, currency, theme, created_at, updated_at
  - Defaults: language='id', currency='IDR', theme='light'

  ### 5. user_profiles
  - Stores user profile information
  - Fields: id, user_id, full_name, avatar_url, phone, bio, created_at, updated_at
  - One profile per user with avatar support via Supabase Storage

  ## Security Features
  - Row Level Security (RLS) enabled on ALL tables
  - Users can only access their own data
  - Default categories viewable by all authenticated users
  - Secure avatar storage with proper access policies
  - Optimized RLS policies using (select auth.uid()) pattern

  ## Performance Optimizations
  - Strategic indexes on foreign keys and frequently queried columns
  - Automatic updated_at timestamp triggers on all tables
  - Unique constraints to prevent duplicate data

  ## Data Integrity
  - Foreign key constraints with appropriate CASCADE/RESTRICT rules
  - Check constraints for valid data (amounts >= 0, valid enum values)
  - NOT NULL constraints on critical fields
  - Unique constraints on user-specific tables
*/

-- ============================================================================
-- SECTION 1: CORE TABLES (Categories, Transactions, Kasbon)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: categories
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  is_default boolean NOT NULL DEFAULT false,
  icon text NOT NULL DEFAULT 'circle',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (
    is_default = true
    OR user_id = (select auth.uid())
  );

CREATE POLICY "Users can create own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND is_default = false
  );

CREATE POLICY "Users can update own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_default ON categories(is_default, type) WHERE is_default = true;

-- ----------------------------------------------------------------------------
-- TABLE: transactions
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- ----------------------------------------------------------------------------
-- TABLE: kasbon (Loans/Debts)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS kasbon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  type text NOT NULL CHECK (type IN ('hutang', 'piutang')),
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partial')),
  due_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE kasbon ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kasbon
CREATE POLICY "Users can view own kasbon"
  ON kasbon
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own kasbon"
  ON kasbon
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own kasbon"
  ON kasbon
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own kasbon"
  ON kasbon
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_kasbon_user_status ON kasbon(user_id, status);

-- ============================================================================
-- SECTION 2: USER SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'id',
  currency text NOT NULL DEFAULT 'IDR',
  theme text NOT NULL DEFAULT 'light',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SECTION 3: USER PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  phone text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SECTION 4: TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Function to update updated_at column (secured)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for auto-updating updated_at on all tables
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kasbon_updated_at
  BEFORE UPDATE ON kasbon
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 5: DEFAULT DATA
-- ============================================================================

-- Pre-populate default categories
INSERT INTO categories (user_id, name, type, is_default, icon) VALUES
  -- Income Categories
  (NULL, 'Gaji', 'income', true, 'banknote'),
  (NULL, 'Bonus', 'income', true, 'gift'),
  (NULL, 'Investasi', 'income', true, 'trending-up'),
  (NULL, 'Bisnis', 'income', true, 'briefcase'),
  (NULL, 'Lainnya', 'income', true, 'circle'),

  -- Expense Categories
  (NULL, 'Makanan', 'expense', true, 'utensils'),
  (NULL, 'Transport', 'expense', true, 'car'),
  (NULL, 'Belanja', 'expense', true, 'shopping-bag'),
  (NULL, 'Tagihan', 'expense', true, 'home'),
  (NULL, 'Hiburan', 'expense', true, 'music'),
  (NULL, 'Kesehatan', 'expense', true, 'heart'),
  (NULL, 'Pendidikan', 'expense', true, 'book'),
  (NULL, 'Olahraga', 'expense', true, 'dumbbell'),
  (NULL, 'Lainnya', 'expense', true, 'circle')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 6: STORAGE BUCKET FOR AVATARS
-- ============================================================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Users can view any avatar"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
/*
  To rollback this migration, execute the following commands in reverse order:

  -- Remove storage policies
  DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view any avatar" ON storage.objects;

  -- Remove storage bucket
  DELETE FROM storage.buckets WHERE id = 'avatars';

  -- Remove default categories
  DELETE FROM categories WHERE is_default = true;

  -- Drop triggers
  DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
  DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
  DROP TRIGGER IF EXISTS update_kasbon_updated_at ON kasbon;
  DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
  DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;

  -- Drop function
  DROP FUNCTION IF EXISTS update_updated_at_column();

  -- Drop tables (in reverse order of creation)
  DROP TABLE IF EXISTS user_profiles CASCADE;
  DROP TABLE IF EXISTS user_settings CASCADE;
  DROP TABLE IF EXISTS kasbon CASCADE;
  DROP TABLE IF EXISTS transactions CASCADE;
  DROP TABLE IF EXISTS categories CASCADE;
*/
