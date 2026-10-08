-- Idempotency table for Paddle webhook events.
-- Each event_id is processed at most once; duplicate deliveries are silently dropped.
CREATE TABLE IF NOT EXISTS public.payment_events (
  event_id    text        PRIMARY KEY,
  event_type  text        NOT NULL,
  environment text        NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Only the service role may read/write this table (webhook handler uses service-role client).
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.payment_events
  AS PERMISSIVE FOR ALL TO service_role
  USING (true) WITH CHECK (true);
