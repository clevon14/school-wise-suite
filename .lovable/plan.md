

## Plan: Multi-School Tenancy with Super-Admin Portal

### Overview
Convert the single-school app into a multi-tenant system where a super-admin manages multiple schools, each with its own branding, data isolation, and admin users -- all within a single database using a `school_id` column approach.

### Architecture

```text
Super Admin
  └── Creates/manages Schools
        ├── School A (name, logo, colors)
        │     ├── Admin users
        │     ├── Students, Teachers, Classes...
        │     └── Fees, Attendance, Exams...
        └── School B (name, logo, colors)
              ├── Admin users
              └── ...
```

### Database Changes

**1. New `schools` table**
- `id`, `name`, `logo_url`, `primary_color`, `secondary_color`, `address`, `phone`, `email`, `tagline`, `academic_year`, `status` (active/inactive), `created_at`

**2. New `user_schools` table**
- Maps users to schools: `user_id`, `school_id`, `is_default`
- A super-admin can access all schools; regular admins/teachers see only their school

**3. New `super_admin` role**
- Add `'super_admin'` to the `app_role` enum
- Super-admins bypass school filtering and can manage the schools table

**4. Add `school_id` column to all major tables**
- `students`, `employees`, `classes`, `subjects`, `attendance`, `tests`, `test_results`, `exams`, `exam_subjects`, `exam_results`, `fee_categories`, `fee_assignments`, `payments`, `class_fee_structure`, `buses`, `bus_routes`, `timetable`, `quizzes`, `documents`, `school_events`, `syllabus_topics`, `syllabus_progress`, `leave_requests`, `class_subjects`, `curriculum_stages`, `curriculum_language_policy`, `curriculum_guidelines`
- Default to NULL initially, then backfill with a "seed" school for existing data

**5. Update RLS policies**
- All existing policies get an additional `school_id` check: users can only access rows where `school_id` matches their assigned school
- Super-admins bypass the school_id filter

### Frontend Changes

**1. Super-Admin Portal (`/super-admin`)**
- Dashboard showing all schools with student/teacher counts
- Create/Edit school form (name, logo upload, colors, contact info)
- Assign admin users to schools

**2. School Selection**
- After login, if a user belongs to multiple schools, show a school picker
- Store selected school in React context (`SchoolContext`)
- All queries automatically filter by the active school_id from context

**3. School Branding Context**
- New `SchoolBrandingProvider` that loads the active school's name, logo, colors
- Replace all hardcoded "Holy Cross School" references with `school.name` from context
- Apply school colors dynamically via CSS variables
- Update receipts, report cards, admission forms, and headers

**4. Updated Landing Page**
- Show school selector or auto-redirect based on user's assigned school

### Files to Create
- `src/contexts/SchoolContext.tsx` -- school selection + branding provider
- `src/pages/SuperAdmin.tsx` -- super-admin dashboard
- `src/pages/SchoolSelector.tsx` -- school picker after login
- `src/components/super-admin/CreateSchoolDialog.tsx`
- `src/components/super-admin/SchoolCard.tsx`
- `src/components/auth/SuperAdminRoute.tsx`
- Migration SQL for schema changes

### Files to Modify
- All pages/components with Supabase queries -- add `.eq('school_id', activeSchoolId)` filter
- `AppSidebar.tsx`, `AppLayout.tsx` -- use branding from context
- `FeeReceipt.tsx`, `ReportCard.tsx`, `PrintableAdmissionForm.tsx`, `PrintableStaffForm.tsx` -- replace hardcoded school name
- `App.tsx` -- add super-admin routes and school context provider
- `Index.tsx`, `Auth.tsx` -- school-aware login flow
- `ProtectedRoute.tsx` -- wrap with school context

### Implementation Order
1. Database migration (schools table, school_id columns, RLS updates)
2. SchoolContext provider + school selector page
3. Super-admin portal (CRUD schools, assign users)
4. Update all queries to filter by school_id
5. Dynamic branding (replace hardcoded names, apply colors)
6. Update printed documents (receipts, report cards, forms)

### Technical Details
- School branding colors stored as hex values, applied via `document.documentElement.style.setProperty('--primary', color)` 
- Logo stored in the existing `photos` storage bucket under `school-logos/` prefix
- The `useSchool()` hook provides `activeSchool`, `setActiveSchool`, and `schoolId` to all components
- A database function `get_user_school_id(user_id)` with SECURITY DEFINER simplifies RLS policies

