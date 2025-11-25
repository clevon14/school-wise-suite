-- Fix 1: Restrict profile UPDATE policy to exclude role column
-- This prevents users from escalating their own privileges
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create separate policies for different columns
CREATE POLICY "Users can update their own profile basic info"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Only admins can update role column
CREATE POLICY "Admins can update any profile role"
  ON public.profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Update trigger to only fire on INSERT (not UPDATE)
-- This prevents the privilege escalation vector
DROP TRIGGER IF EXISTS on_profile_role_set ON public.profiles;
CREATE TRIGGER on_profile_role_set
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role IS NOT NULL)
  EXECUTE FUNCTION public.assign_role_on_profile_create();