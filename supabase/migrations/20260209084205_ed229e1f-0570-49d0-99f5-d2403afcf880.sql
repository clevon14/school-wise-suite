
-- Fix 1: Rate limits table - replace permissive policy with admin-only policy
-- The check_rate_limit() SECURITY DEFINER function bypasses RLS, so it still works
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;

-- Allow admins to manage rate limits directly
CREATE POLICY "Admins manage rate limits"
  ON public.rate_limits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow users to view their own rate limit records (read-only)
CREATE POLICY "Users can view own rate limits"
  ON public.rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Fix 2: Create private documents bucket for sensitive employee files
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for documents bucket
CREATE POLICY "Admins can manage documents"
  ON storage.objects FOR ALL
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'teachers'
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid()
    )
  );
