-- Set security_invoker to true on views to ensure they respect RLS of the querying user
-- This fixes the security definer view linter warning

ALTER VIEW public.student_monthly_fee_summary SET (security_invoker = true);
ALTER VIEW public.class_monthly_fee_summary SET (security_invoker = true);