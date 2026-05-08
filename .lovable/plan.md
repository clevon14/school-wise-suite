## Goal
Give admins a clean way to handle teachers who **resign, retire, or are dismissed** — without deleting their records (needed for audit, past marks, attendance history, salary history).

## Current state
- `employees` table already has a `status` column (default `'active'`).
- Today the Teachers page only shows the status badge — there's no UI action to change it, no exit date, no reason, and no impact on class assignments or login access.

## Proposed flow

### 1. New "Exit Teacher" action on the Teachers page
On each row in `src/pages/Teachers.tsx`, add a **UserX** menu action → opens an **Exit Teacher dialog** with:
- Exit type: *Resigned / Dismissed / Retired / Terminated / On long leave*
- Last working date (date picker, defaults to today)
- Reason / notes (textarea)
- Checkbox: "Disable login account" (default ON)
- Checkbox: "Unassign from classes & subjects" (default ON)

### 2. What happens on submit
- `employees.status` → set to the chosen exit type (e.g. `resigned`, `dismissed`, `retired`)
- Store `exit_date` and `exit_reason` (new columns)
- If "Unassign" checked → null out `class_subjects.teacher_id` for that employee (keeps the class–subject row, just removes the teacher)
- If "Disable login" checked → set `profiles.is_active = false` for the linked user (login blocked, data preserved)
- Write a row to `audit_logs` (`action: 'teacher_exit'`)

### 3. Filter & visibility
- Teachers page gets a **status filter**: Active (default) / Exited / All
- Exited teachers shown with a muted row + status badge
- Exit date and reason visible in the row / Edit dialog
- An admin can **reinstate** an exited teacher (status → active, optionally re-enable login)

### 4. What is NOT touched
- Past attendance, marks, leave history, salary records — all preserved
- The teacher's `employees` row is never deleted
- Class–subject rows remain (just teacher unassigned), so admin can pick a replacement

## Technical changes

**DB migration**
```sql
ALTER TABLE employees
  ADD COLUMN exit_date date,
  ADD COLUMN exit_reason text,
  ADD COLUMN exit_type text;  -- resigned | dismissed | retired | terminated
```
Status values used: `active`, `resigned`, `dismissed`, `retired`, `terminated`, `on_leave`.

**Frontend**
- New: `src/components/teachers/ExitTeacherDialog.tsx`
- New: `src/components/teachers/ReinstateTeacherDialog.tsx`
- Edit: `src/pages/Teachers.tsx` — add status filter, exit/reinstate actions, exit columns
- Edit: `src/components/teachers/EditTeacherDialog.tsx` — show exit info read-only when status ≠ active

**Out of scope** (can do later if you want):
- Final settlement / pending salary calculation
- Auto-reassign their classes to another teacher in one click
- Generating a relieving / experience letter PDF
