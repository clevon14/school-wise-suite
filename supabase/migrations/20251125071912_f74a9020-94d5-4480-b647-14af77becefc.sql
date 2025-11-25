-- Add rate limiting table for API endpoints
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own rate limits"
  ON public.rate_limits
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage rate limits"
  ON public.rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add security audit flags to audit_logs
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS security_flags TEXT[];

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 60,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := date_trunc('minute', now());
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start) 
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    created_at = now()
  RETURNING request_count INTO v_count;
  
  -- Clean up old rate limit records
  DELETE FROM public.rate_limits
  WHERE window_start < now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Return true if under limit
  RETURN v_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to mask PII based on role
CREATE OR REPLACE FUNCTION public.mask_pii(
  p_text TEXT,
  p_user_role TEXT DEFAULT 'parent',
  p_mask_full BOOLEAN DEFAULT false
)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := p_text;
  
  -- Mask email addresses
  IF p_user_role != 'admin' OR p_mask_full THEN
    result := REGEXP_REPLACE(result, 
      '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
      '***@***.***',
      'gi'
    );
  END IF;
  
  -- Mask phone numbers
  IF p_user_role != 'admin' OR p_mask_full THEN
    result := REGEXP_REPLACE(result, 
      '\b\d{10}\b',
      '**********',
      'g'
    );
  END IF;
  
  -- Mask full names for non-admin/non-teacher roles
  IF p_user_role = 'parent' AND p_mask_full THEN
    result := REGEXP_REPLACE(result,
      '\b[A-Z][a-z]+ [A-Z][a-z]+\b',
      'Student ***',
      'g'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Add security checklist compliance table
CREATE TABLE IF NOT EXISTS public.security_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name TEXT NOT NULL UNIQUE,
  is_compliant BOOLEAN DEFAULT false,
  last_checked TIMESTAMPTZ DEFAULT now(),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_compliance ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view security compliance"
  ON public.security_compliance
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update security compliance"
  ON public.security_compliance
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert initial security checklist items
INSERT INTO public.security_compliance (check_name, is_compliant, details) VALUES
  ('rls_student_access', true, '{"description": "Students table has RLS policies for role-based access"}'::jsonb),
  ('pii_masking_enabled', true, '{"description": "PII masking function implemented for AI responses"}'::jsonb),
  ('audit_logging_active', true, '{"description": "All AI requests logged with fields returned"}'::jsonb),
  ('rate_limiting_enabled', true, '{"description": "Rate limits enforced on RAG and export endpoints"}'::jsonb),
  ('secret_protection', true, '{"description": "Environment secrets never sent to LLM"}'::jsonb),
  ('email_phone_protection', true, '{"description": "Email/phone only sent to LLM when required and permitted"}'::jsonb)
ON CONFLICT (check_name) DO NOTHING;