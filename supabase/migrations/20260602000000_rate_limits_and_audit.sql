-- Durable per-window rate limits for server-side cost protection.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key_hash, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_rate_limits" ON public.rate_limits;
CREATE POLICY "service_role_all_rate_limits" ON public.rate_limits
  AS PERMISSIVE FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.reserve_rate_limit(
  limit_key_hash text,
  window_seconds integer,
  max_requests integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bucket_start timestamptz;
  reserved_count integer;
BEGIN
  IF limit_key_hash IS NULL OR limit_key_hash = '' THEN
    RETURN false;
  END IF;
  IF window_seconds <= 0 OR max_requests <= 0 THEN
    RETURN false;
  END IF;

  bucket_start := to_timestamp(
    floor(extract(epoch FROM now()) / window_seconds) * window_seconds
  );

  INSERT INTO public.rate_limits (key_hash, window_start, count)
  VALUES (limit_key_hash, bucket_start, 1)
  ON CONFLICT (key_hash, window_start) DO UPDATE
    SET count = public.rate_limits.count + 1,
        updated_at = now()
    WHERE public.rate_limits.count < max_requests
  RETURNING count INTO reserved_count;

  RETURN reserved_count IS NOT NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_rate_limit(text, integer, integer) TO service_role;

-- Structured audit events for privileged server-side actions.
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_audit_log" ON public.audit_log;
CREATE POLICY "service_role_all_audit_log" ON public.audit_log
  AS PERMISSIVE FOR ALL TO service_role
  USING (true) WITH CHECK (true);
