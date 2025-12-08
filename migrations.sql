/*
  ============================================================================
  COMPLETE DATABASE SETUP - Finance Tracker Application
  ============================================================================

  Version: 4.1.0
  Date: December 8, 2025

  This consolidated migration file creates ALL required database tables,
  security policies, indexes, and default data for the Finance Tracker
  application in a single execution.

  TABLES CREATED:
  1. categories - Transaction categories (default + user-created)
  2. transactions - Financial transactions
  3. kasbon - Loan/debt tracking
  4. user_settings - User preferences (theme, language, currency)
  5. user_profiles - User profile information with avatar support

  FEATURES:
  - Row Level Security (RLS) enabled on all tables
  - Optimized indexes for performance
  - Automatic timestamp updates
  - Storage bucket for user avatars
  - 14 default categories pre-populated

  USAGE:
  1. Open Supabase Dashboard → SQL Editor
  2. Copy and paste this entire file
  3. Click "Run" to execute
  4. Verify tables created with verification queries at the end

  ============================================================================
*/

-- ============================================================================
-- CLEANUP: Drop existing objects if re-running (CAREFUL IN PRODUCTION!)
-- ============================================================================

-- Uncomment the following block ONLY if you need to reset the database
-- WARNING: This will delete all data!

/*
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_kasbon_updated_at ON kasbon;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS kasbon CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
*/

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
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
-- TABLE 1: categories
-- Purpose: Store transaction categories (both default and user-created)
-- ============================================================================

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

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can view categories'
  ) THEN
    CREATE POLICY "Users can view categories"
      ON categories FOR SELECT TO authenticated
      USING (is_default = true OR user_id = (select auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can create own categories'
  ) THEN
    CREATE POLICY "Users can create own categories"
      ON categories FOR INSERT TO authenticated
      WITH CHECK (user_id = (select auth.uid()) AND is_default = false);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can update own categories'
  ) THEN
    CREATE POLICY "Users can update own categories"
      ON categories FOR UPDATE TO authenticated
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can delete own categories'
  ) THEN
    CREATE POLICY "Users can delete own categories"
      ON categories FOR DELETE TO authenticated
      USING (user_id = (select auth.uid()));
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_default ON categories(is_default, type) WHERE is_default = true;

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 2: transactions
-- Purpose: Store all financial transactions
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

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view own transactions'
  ) THEN
    CREATE POLICY "Users can view own transactions"
      ON transactions FOR SELECT TO authenticated
      USING (user_id = (select auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can create own transactions'
  ) THEN
    CREATE POLICY "Users can create own transactions"
      ON transactions FOR INSERT TO authenticated
      WITH CHECK (user_id = (select auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can update own transactions'
  ) THEN
    CREATE POLICY "Users can update own transactions"
      ON transactions FOR UPDATE TO authenticated
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can delete own transactions'
  ) THEN
    CREATE POLICY "Users can delete own transactions"
      ON transactions FOR DELETE TO authenticated
      USING (user_id = (select auth.uid()));
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 3: kasbon
-- Purpose: Track loans and debts
-- ============================================================================

CREATE TABLE IF NOT EXISTS kasbon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partial')),
  loan_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE kasbon ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kasbon' AND policyname = 'Users can view own kasbon'
  ) THEN
    CREATE POLICY "Users can view own kasbon"
      ON kasbon FOR SELECT TO authenticated
      USING (user_id = (select auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kasbon' AND policyname = 'Users can create own kasbon'
  ) THEN
    CREATE POLICY "Users can create own kasbon"
      ON kasbon FOR INSERT TO authenticated
      WITH CHECK (user_id = (select auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kasbon' AND policyname = 'Users can update own kasbon'
  ) THEN
    CREATE POLICY "Users can update own kasbon"
      ON kasbon FOR UPDATE TO authenticated
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kasbon' AND policyname = 'Users can delete own kasbon'
  ) THEN
    CREATE POLICY "Users can delete own kasbon"
      ON kasbon FOR DELETE TO authenticated
      USING (user_id = (select auth.uid()));
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kasbon_user_status ON kasbon(user_id, status);
CREATE INDEX IF NOT EXISTS idx_kasbon_loan_date ON kasbon(loan_date DESC);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_kasbon_updated_at ON kasbon;
CREATE TRIGGER update_kasbon_updated_at
  BEFORE UPDATE ON kasbon
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 4: user_settings
-- Purpose: Store user preferences (theme, language, currency)
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

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can read own settings'
  ) THEN
    CREATE POLICY "Users can read own settings"
      ON user_settings FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert own settings'
  ) THEN
    CREATE POLICY "Users can insert own settings"
      ON user_settings FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update own settings'
  ) THEN
    CREATE POLICY "Users can update own settings"
      ON user_settings FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 5: user_profiles
-- Purpose: Store user profile information with avatar support
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

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON user_profiles FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON user_profiles FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKET: avatars
-- Purpose: Store user profile photos
-- ============================================================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can view any avatar'
  ) THEN
    CREATE POLICY "Users can view any avatar"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'avatars');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can upload own avatar'
  ) THEN
    CREATE POLICY "Users can upload own avatar"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can update own avatar'
  ) THEN
    CREATE POLICY "Users can update own avatar"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete own avatar'
  ) THEN
    CREATE POLICY "Users can delete own avatar"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ============================================================================
-- DEFAULT DATA: Pre-populate categories
-- ============================================================================

-- Insert default categories (if not exist)
INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Gaji', 'income', true, 'banknote'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Gaji' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Bonus', 'income', true, 'gift'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Bonus' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Investasi', 'income', true, 'trending-up'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Investasi' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Bisnis', 'income', true, 'briefcase'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Bisnis' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Lainnya', 'income', true, 'circle'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Lainnya' AND type = 'income' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Makanan', 'expense', true, 'utensils'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Makanan' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Transport', 'expense', true, 'car'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Transport' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Belanja', 'expense', true, 'shopping-bag'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Belanja' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Tagihan', 'expense', true, 'home'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Tagihan' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Hiburan', 'expense', true, 'music'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Hiburan' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Kesehatan', 'expense', true, 'heart'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Kesehatan' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Pendidikan', 'expense', true, 'book'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pendidikan' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Olahraga', 'expense', true, 'dumbbell'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Olahraga' AND is_default = true);

INSERT INTO categories (user_id, name, type, is_default, icon)
SELECT NULL, 'Lainnya', 'expense', true, 'circle'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Lainnya' AND type = 'expense' AND is_default = true);

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify everything is set up correctly
-- ============================================================================

-- Check all tables exist
SELECT 'Tables Created' AS status, COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('categories', 'transactions', 'kasbon', 'user_settings', 'user_profiles');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('categories', 'transactions', 'kasbon', 'user_settings', 'user_profiles');

-- Check default categories
SELECT 'Default Categories' AS status, COUNT(*) AS count FROM categories WHERE is_default = true;

-- Check storage bucket
SELECT 'Storage Bucket' AS status, name, public FROM storage.buckets WHERE id = 'avatars';

-- List all policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY tablename, policyname;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================

/*
  NEXT STEPS:

  1. ✅ Run this entire SQL script in Supabase SQL Editor
  2. ✅ Check verification queries above show expected results
  3. ✅ Test authentication flow (signup/login)
  4. ✅ Test creating transactions, categories, kasbon
  5. ✅ Test uploading avatar in profile
  6. ✅ Deploy your application

  EXPECTED VERIFICATION RESULTS:
  - Tables Created: 5
  - All tables show rowsecurity = true
  - Default Categories: 14
  - Storage Bucket: avatars (public = true)
  - Multiple policies for each table

  If any verification fails, review the error messages and re-run
  specific sections as needed.

  For support: andreanwar713@gmail.com
*/
