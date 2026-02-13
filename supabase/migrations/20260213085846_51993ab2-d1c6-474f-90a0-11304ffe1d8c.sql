
-- Create school_events table for Academic Calendar
CREATE TABLE public.school_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'holiday',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage school events"
  ON public.school_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view school events"
  ON public.school_events FOR SELECT
  USING (true);

CREATE TRIGGER update_school_events_updated_at
  BEFORE UPDATE ON public.school_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create leave_requests table for Staff Leave Management
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all leave requests"
  ON public.leave_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view their own leave requests"
  ON public.leave_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() AND e.id = leave_requests.employee_id
  ));

CREATE POLICY "Teachers can create their own leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() AND e.id = leave_requests.employee_id
  ));

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
