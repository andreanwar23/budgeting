/*
  # Complete Database Setup - Finance Tracker Application

  **Migration Version:** Consolidated Complete Setup
  **Created:** December 8, 2025
  **Description:** Consolidated migration containing all database objects

  ## Overview
  This migration creates and configures the complete database schema for the
  Finance Tracker application with proper security, performance optimization,
  and data integrity.

  ## Tables Created

  ### 1. categories
  - Stores transaction categories (both default and user-created)
  - Fields: id, user_id, name, type, is_default, icon, created_at, updated_at
  - Supports income and expense categories
  - Includes 14 pre-populated default categories

  ### 2. transactions
  - Stores all financial transactions
  - Fields: id, user_id, amount, type, category_id, title, description,
           transaction_date, created_at, updated_at
  - Foreign key to categories table

  ### 3. kasbon
  - Stores loan/debt records
  - Fields: id, user_id, name, amount, loan_date, due_date, status, notes,
           created_at, updated_at
  - Supports unpaid, paid, and partial statuses

  ### 4. user_settings
  - Stores user preferences and settings
  - Fields: id, user_id, language, currency, theme, created_at, updated_at
  - One settings record per user (unique constraint)

  ### 5. user_profiles
  - Stores user profile information
  - Fields: id, user_id, full_name, avatar_url, phone, bio, created_at, updated_at
  - One profile per user (unique constraint)

  ## Security Features
  - All tables have Row Level Security (RLS) enabled
  - Users can only access their own data
  - Default categories are viewable by all authenticated users
  - Optimized RLS policies using (select auth.uid()) pattern
  - Secure function definitions with proper search_path

  ## Performance Optimizations
  - Strategic indexes on frequently queried columns
  - Composite indexes for multi-column queries
  - Partial indexes for conditional queries
  - Optimized RLS policies to prevent re-evaluation

  ## Storage
  - Avatars bucket for user profile photos
  - Public read access, authenticated write access
  - User-specific folder structure for security
*/

-- ============================================================================
-- HELPER FUNCTION: Update updated_at timestamp
-- ============================================================================

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

-- ============================================================================
-- TABLE: categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  is_default boolean NOT NULL DEFAULT false,
  icon text NOT NULL DEFAULT 'circle',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT categories_default_no_user CHECK (
    (is_default = true AND user_id IS NULL) OR (is_default = false AND user_id IS NOT NULL)
  )
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view categories" ON categories;
CREATE POLICY "Users can view categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (
    is_default = true
    OR user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can create own categories" ON categories;
CREATE POLICY "Users can create own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND is_default = false
  );

DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_default ON categories(is_default, type)
  WHERE is_default = true;

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: transactions
-- ============================================================================

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

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
CREATE POLICY "Users can create own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(user_id, type);

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: kasbon
-- ============================================================================

CREATE TABLE IF NOT EXISTS kasbon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  loan_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partial')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kasbon ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own kasbon" ON kasbon;
CREATE POLICY "Users can view own kasbon"
  ON kasbon
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own kasbon" ON kasbon;
CREATE POLICY "Users can create own kasbon"
  ON kasbon
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own kasbon" ON kasbon;
CREATE POLICY "Users can update own kasbon"
  ON kasbon
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own kasbon" ON kasbon;
CREATE POLICY "Users can delete own kasbon"
  ON kasbon
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE INDEX IF NOT EXISTS idx_kasbon_user_status ON kasbon(user_id, status);
CREATE INDEX IF NOT EXISTS idx_kasbon_loan_date ON kasbon(loan_date DESC);

DROP TRIGGER IF EXISTS update_kasbon_updated_at ON kasbon;
CREATE TRIGGER update_kasbon_updated_at
  BEFORE UPDATE ON kasbon
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: user_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  language text NOT NULL DEFAULT 'id',
  currency text NOT NULL DEFAULT 'IDR',
  theme text NOT NULL DEFAULT 'light',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: user_profiles
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

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE: Avatars Bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can view any avatar" ON storage.objects;
CREATE POLICY "Users can view any avatar"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- ============================================================================
-- DEFAULT DATA: Pre-populate Categories
-- ============================================================================

INSERT INTO categories (user_id, name, type, is_default, icon)
VALUES
  (NULL, 'Gaji', 'income', true, 'banknote'),
  (NULL, 'Bonus', 'income', true, 'gift'),
  (NULL, 'Investasi', 'income', true, 'trending-up'),
  (NULL, 'Bisnis', 'income', true, 'briefcase'),
  (NULL, 'Lainnya', 'income', true, 'circle'),
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
