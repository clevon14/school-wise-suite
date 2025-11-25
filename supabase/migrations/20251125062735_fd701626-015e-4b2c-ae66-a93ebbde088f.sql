-- Fix security definer views by recreating them without security definer
-- Views should not use security definer, only functions should

-- Recreate student_monthly_fee_summary view without security definer
DROP VIEW IF EXISTS public.student_monthly_fee_summary;
CREATE VIEW public.student_monthly_fee_summary AS
SELECT 
  s.id as student_id,
  s.first_name,
  s.last_name,
  s.admission_number,
  c.name as class_name,
  c.section,
  s.village,
  COALESCE(SUM(fa.amount), 0) as total_monthly_fee,
  COALESCE(SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END), 0) as paid_amount,
  COALESCE(SUM(CASE WHEN fa.status != 'paid' THEN fa.amount ELSE 0 END), 0) as pending_amount,
  COUNT(fa.id) as total_fee_items,
  COUNT(CASE WHEN fa.status = 'paid' THEN 1 END) as paid_items
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN fee_assignments fa ON s.id = fa.student_id 
  AND fa.due_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND fa.due_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, s.admission_number, c.name, c.section, s.village;

-- Recreate class_monthly_fee_summary view without security definer
DROP VIEW IF EXISTS public.class_monthly_fee_summary;
CREATE VIEW public.class_monthly_fee_summary AS
SELECT 
  c.id as class_id,
  c.name as class_name,
  c.section,
  COUNT(DISTINCT s.id) as total_students,
  COALESCE(SUM(fa.amount), 0) as total_monthly_fees,
  COALESCE(SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END), 0) as collected_amount,
  COALESCE(SUM(CASE WHEN fa.status != 'paid' THEN fa.amount ELSE 0 END), 0) as pending_amount,
  ROUND(COALESCE(SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END), 0) * 100.0 / 
    NULLIF(SUM(fa.amount), 0), 2) as collection_percentage
FROM classes c
LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
LEFT JOIN fee_assignments fa ON s.id = fa.student_id
  AND fa.due_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND fa.due_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY c.id, c.name, c.section
ORDER BY c.name, c.section;