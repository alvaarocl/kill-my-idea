-- Atomic monthly quota reservation for personal analyses.
CREATE OR REPLACE FUNCTION public.reserve_analysis_quota(
  user_uuid uuid,
  period_start_date date,
  quota_limit integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reserved_count integer;
BEGIN
  IF quota_limit <= 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.usage_counters (user_id, period_start, analyses_used)
  VALUES (user_uuid, period_start_date, 1)
  ON CONFLICT (user_id, period_start) DO UPDATE
    SET analyses_used = public.usage_counters.analyses_used + 1
    WHERE public.usage_counters.analyses_used < quota_limit
  RETURNING analyses_used INTO reserved_count;

  RETURN reserved_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_analysis_quota(
  user_uuid uuid,
  period_start_date date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released_count integer;
BEGIN
  UPDATE public.usage_counters
  SET analyses_used = GREATEST(analyses_used - 1, 0)
  WHERE user_id = user_uuid
    AND period_start = period_start_date
  RETURNING analyses_used INTO released_count;

  RETURN released_count;
END;
$$;

-- Aggregated admin dashboard helper. Server code still verifies admin before calling.
CREATE OR REPLACE FUNCTION public.get_admin_top_users(limit_count integer DEFAULT 25)
RETURNS TABLE(user_id uuid, analyses bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.user_id, COUNT(*)::bigint AS analyses
  FROM public.analyses a
  GROUP BY a.user_id
  ORDER BY COUNT(*) DESC
  LIMIT GREATEST(limit_count, 0)
$$;
