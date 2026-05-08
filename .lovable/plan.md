## Goal
Shift every active student up by one class in preparation for June 2026 admissions, and free up Class 1 for incoming students.

## Promotions

| From | To | Students |
|---|---|---|
| Class 9 A | Class 10 A | 21 |
| Class 8 A | Class 9 A | 41 |
| Class 7 A | Class 8 A | 57 |
| Class 6 A | Class 7 A | 48 |
| Class 5 A | Class 6 A | 44 |
| Class 4 A | Class 5 A | 37 |
| Class 3 A | Class 4 A | 44 |
| Class 2 A | Class 3 A | 29 |
| Class 1 A | Class 2 A | 25 |
| Class 1 A | — | **left empty (0)** for new admissions |

Total: **346 active students** moved.

## Steps

1. **Run the promotions in reverse order** (9→10 first, down to 1→2) so no class collides during the update.
2. For each promoted student, log a row in `promotion_history` with `action='promote'`, `from_class_id`, `to_class_id`, `academic_year='2026-2027'`, and `promoted_by` = current admin.
3. **Normalize all classes** to `academic_year = '2026-2027'` (currently mixed between `2025-2026` and `2026`).
4. Class 1 A is left intact — same row, just no students assigned, ready to receive June admissions.

## Safety
- Only `status='active'` students are touched. Transferred / inactive students stay where they are.
- Class 10 currently has 0 students, so no one is dropped/graduated by this run.
- Everything runs in a single transaction — if any step fails, nothing is committed.
- Full audit trail via `promotion_history`.

## Out of scope
- No changes to fees, attendance, or marks (those stay tied to the student, not the class).
- No new sections created.
- No graduation/archival of Class 10 (none exist yet).
