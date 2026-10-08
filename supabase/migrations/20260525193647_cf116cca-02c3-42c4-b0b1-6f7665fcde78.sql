-- Drop existing subscriptions table (was Stripe-shaped placeholder, no data of value)
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Paddle subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Active-subscription helper
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active', 'trialing', 'past_due')
          AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

-- Helper that returns the user's current effective plan (founder, pro, or free)
CREATE OR REPLACE FUNCTION public.get_user_plan(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT
      CASE
        WHEN product_id = 'pro_plan' THEN 'pro'
        WHEN product_id = 'founder_plan' THEN 'founder'
        ELSE 'free'
      END
     FROM public.subscriptions
     WHERE user_id = user_uuid
       AND environment = check_env
       AND (
         (status IN ('active', 'trialing', 'past_due')
           AND (current_period_end IS NULL OR current_period_end > now()))
         OR (status = 'canceled' AND current_period_end > now())
       )
     ORDER BY
       CASE WHEN product_id = 'pro_plan' THEN 1 ELSE 2 END,
       created_at DESC
     LIMIT 1),
    'free'
  );
$$;

-- Add unlocked flag to analyses for €5 single-report purchases
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS unlocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS paddle_transaction_id text;

CREATE INDEX IF NOT EXISTS idx_analyses_paddle_tx ON public.analyses(paddle_transaction_id);

-- One-time purchases log (for €5 single-report transactions, audit + idempotency)
CREATE TABLE IF NOT EXISTS public.one_time_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_transaction_id text NOT NULL UNIQUE,
  paddle_customer_id text,
  price_id text NOT NULL,
  product_id text NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL,
  analysis_id uuid REFERENCES public.analyses(id) ON DELETE SET NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own one-time purchases"
  ON public.one_time_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages one-time purchases"
  ON public.one_time_purchases FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Re-seed the new-user trigger (old one inserted into the dropped subscriptions table)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();