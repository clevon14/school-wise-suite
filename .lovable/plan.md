

## Current Status

The Super Admin portal code is fully implemented and the app is running (you're currently on /classes with no errors). The browser automation tool is experiencing transient 502 connectivity issues, preventing me from testing directly.

### What's in place:
- `/super-admin` route with `SuperAdminRoute` guard
- `SchoolContext` checks for `super_admin` role in `user_roles`
- `SuperAdmin.tsx` page with school CRUD (create, delete, view stats)
- `CreateSchoolDialog` with name, tagline, address, colors
- `SchoolCard` with Enter/Delete actions

### To test manually:
1. Navigate to `/super-admin` in your preview
2. If you see the Super Admin portal -- your role assignment worked
3. If you get redirected to `/dashboard` -- the `super_admin` role wasn't found in `user_roles`

### Potential issue: `super_admin` not in the enum
The `app_role` enum in the database is currently: `admin | teacher | parent | student`. The migration should have added `super_admin` to it. If the role insert failed silently because `super_admin` isn't a valid enum value, the guard will redirect you.

**Quick fix** -- run this in the SQL Editor to verify:
```sql
-- Check if super_admin exists in the enum
SELECT unnest(enum_range(NULL::app_role));

-- If super_admin is NOT listed, add it:
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Then re-insert your role:
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Next step
Please navigate to `/super-admin` in your preview and let me know what you see. If it works, try clicking "Add School" to test creation.

