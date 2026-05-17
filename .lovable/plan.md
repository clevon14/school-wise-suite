## Homework & Assignments Module

A new top-level module so teachers can post homework/assignments per class+subject, students can view and submit, parents can monitor, and teachers can grade and track who has/hasn't turned in.

### User flows

**Teacher**
- Open "Homework" → see list of own postings (filter by class/subject/status).
- "New Homework" → pick class + subject, title, instructions, due date/time, max marks, allow late submissions Y/N, attach files.
- On a homework row → "Submissions" drawer shows all students in that class: status (Not started / Submitted / Late / Graded), submitted file/text, grade input, feedback textarea.
- One-click "Notify class" sends a notification row to students+parents.

**Student**
- Open "Homework" → tabbed view: **Pending** / **Submitted** / **Graded**. Cards show subject, title, due-in countdown, status badge.
- Open a homework → read instructions, download attachments, submit (text answer + optional file). Can resubmit until due date if not yet graded.

**Parent**
- Open Parent Portal → new "Homework" section listing each child's pending/overdue/submitted/graded items. Read-only.

**Admin**
- Read-only oversight: filter all homework by class/teacher/date; view submission stats per homework.

### Database

Two new tables (RLS enabled, school-scoped).

**`homework`**
- id, school_id, class_id, subject_id, teacher_id (employees.id)
- title, instructions (text), attachment_urls (text[])
- assigned_date (date, default today), due_date (timestamptz)
- max_marks (numeric, nullable), allow_late (boolean, default true)
- status (`draft` | `published` | `closed`)
- created_at, updated_at

**`homework_submissions`**
- id, school_id, homework_id, student_id
- submission_text (text), attachment_urls (text[])
- submitted_at (timestamptz, nullable)
- is_late (boolean)
- marks_awarded (numeric, nullable), feedback (text)
- graded_by (employees.id), graded_at
- status (`not_started` | `submitted` | `late` | `graded`)
- created_at, updated_at
- UNIQUE(homework_id, student_id)

**RLS policies**
- `homework`: admins manage in their school; teachers manage rows where `teacher_id` = their employee row; students/parents SELECT only when `status='published'` AND the student is in the class.
- `homework_submissions`: admins manage in their school; teachers SELECT/UPDATE rows for their own homework (for grading); students INSERT/UPDATE their own row pre-grading; parents SELECT rows for their own children.
- Storage: reuse the existing private `documents` bucket under path `homework/<school_id>/<homework_id>/...` for teacher attachments and `homework_submissions/<school_id>/<homework_id>/<student_user_id>/...` for student files. Add storage policies that enforce those path prefixes.

**Index**
- `homework(class_id, due_date)`, `homework(teacher_id)`, `homework_submissions(homework_id)`, `homework_submissions(student_id)`.

**Trigger**
- `update_updated_at_column()` on both tables.
- Optional: when a submission row is inserted/updated with `submitted_at`, set `is_late = (submitted_at > homework.due_date)` and `status` accordingly.

### Routes & navigation

- `/homework` — list page (role-aware: teacher list of own, admin list of all, student/parent list of assigned).
- `/homework/:id` — detail page with submissions drawer (teacher/admin) or submission form (student).
- Sidebar: add **Homework** (icon `ClipboardList`) to both `adminMenuItems` and `teacherMenuItems`. Add a **Homework** card to Parent Portal.

### Components

```
src/pages/Homework.tsx                    role-aware list
src/pages/HomeworkDetail.tsx              detail + submissions
src/components/homework/
  CreateHomeworkDialog.tsx                teacher: create/edit
  HomeworkCard.tsx                        list item
  SubmissionsTable.tsx                    teacher/admin: grade grid
  StudentSubmissionForm.tsx               student: submit/resubmit
  HomeworkAttachments.tsx                 upload+list using documents bucket
  ParentHomeworkList.tsx                  embedded in ParentPortal
```

Reuse existing `useQuery`/`useMutation` patterns, shadcn `Dialog`, `Card`, `Table`, `Tabs`, `Badge`, `Textarea`, `Calendar` (date picker), and toast feedback. Match the warm microcopy and one-task-per-screen rules already in the project memory.

### Notifications

When a teacher publishes homework, insert a row into `notifications` with `target_role={student,parent}` and `target_class_id` so the existing notifications page shows it. Same on grading completion (notify that student only).

### Out of scope (for this iteration)

- Plagiarism checks / AI grading.
- Per-student differentiated homework.
- Group submissions.
- Real-time updates (poll/refresh on focus is fine).

### Implementation order

1. Migration (tables, policies, storage policies, triggers, indexes).
2. Sidebar entry + route + skeleton `Homework.tsx` (role-aware shell).
3. Teacher flow: `CreateHomeworkDialog`, list, attachments upload.
4. Student flow: detail page + `StudentSubmissionForm`.
5. Teacher grading: `SubmissionsTable` with inline marks/feedback.
6. Parent embed in `ParentPortal`.
7. Notifications hookup on publish + grade.
