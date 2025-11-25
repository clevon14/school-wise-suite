-- Add admin role to current user
-- This assumes the user already has an auth account

DO $$
DECLARE
  v_user_id uuid := '33816ff2-71fb-4480-9f4d-c1d858c78359';
BEGIN
  -- Check if user_id exists in auth.users by trying to insert into user_roles
  -- If the user exists, add admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Admin role added to user %', v_user_id;
END $$;