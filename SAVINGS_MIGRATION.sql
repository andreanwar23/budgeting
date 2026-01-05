/*
  # Create Savings/Menabung Feature Tables
  
  INSTRUCTIONS: Apply this migration via Supabase Dashboard > SQL Editor
  or use your preferred database migration tool.
  
  This creates:
  - savings_goals table (stores savings goals with targets)
  - savings_transactions table (deposits and withdrawals)
  - Automatic triggers to update goal amounts
  - RLS policies for security
*/

-- ============================================================================
-- TABLE: savings_goals
-- ============================================================================

CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  current_amount numeric NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  target_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_target_date CHECK (target_date IS NULL OR target_date >= start_date)
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings goals"
  ON savings_goals FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own savings goals"
  ON savings_goals FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own savings goals"
  ON savings_goals FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own savings goals"
  ON savings_goals FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_date ON savings_goals(user_id, start_date DESC);

-- ============================================================================
-- TABLE: savings_transactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS savings_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  amount numeric NOT NULL CHECK (amount > 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings transactions"
  ON savings_transactions FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own savings transactions"
  ON savings_transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own savings transactions"
  ON savings_transactions FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own savings transactions"
  ON savings_transactions FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

CREATE INDEX IF NOT EXISTS idx_savings_transactions_goal ON savings_transactions(goal_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user ON savings_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_type ON savings_transactions(goal_id, type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_savings_goal_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.type = 'deposit' THEN
      UPDATE savings_goals SET current_amount = current_amount + NEW.amount WHERE id = NEW.goal_id;
    ELSIF NEW.type = 'withdraw' THEN
      UPDATE savings_goals SET current_amount = current_amount - NEW.amount WHERE id = NEW.goal_id;
    END IF;
    RETURN NEW;
  END IF;
  IF (TG_OP = 'DELETE') THEN
    IF OLD.type = 'deposit' THEN
      UPDATE savings_goals SET current_amount = current_amount - OLD.amount WHERE id = OLD.goal_id;
    ELSIF OLD.type = 'withdraw' THEN
      UPDATE savings_goals SET current_amount = current_amount + OLD.amount WHERE id = OLD.goal_id;
    END IF;
    RETURN OLD;
  END IF;
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.type = 'deposit' THEN
      UPDATE savings_goals SET current_amount = current_amount - OLD.amount WHERE id = OLD.goal_id;
    ELSIF OLD.type = 'withdraw' THEN
      UPDATE savings_goals SET current_amount = current_amount + OLD.amount WHERE id = OLD.goal_id;
    END IF;
    IF NEW.type = 'deposit' THEN
      UPDATE savings_goals SET current_amount = current_amount + NEW.amount WHERE id = NEW.goal_id;
    ELSIF NEW.type = 'withdraw' THEN
      UPDATE savings_goals SET current_amount = current_amount - NEW.amount WHERE id = NEW.goal_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_savings_goal_amount_trigger
  AFTER INSERT OR UPDATE OR DELETE ON savings_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_savings_goal_amount();
