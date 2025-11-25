# SchoolCare-AI Setup Guide

Full-stack school management system with AI-powered RAG assistant, built with React + Supabase + Vector DB.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase Edge Functions (serverless)
- **Database**: PostgreSQL with pgvector extension
- **AI**: Lovable AI Gateway with RAG pipeline
- **Auth**: Supabase Auth with RBAC

## Environment Variables

Already configured in `.env`:
```
VITE_SUPABASE_PROJECT_ID=bwzlgevdcplryjygfsdt
VITE_SUPABASE_URL=https://bwzlgevdcplryjygfsdt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optional Integrations

For payment processing (Razorpay) or SMS (Twilio), add secrets via Supabase Dashboard:
- Go to: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt/settings/vault
- Add: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Add: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

## Seed Data

Database includes:
- 3 classes (Class 1A, 2B, 3A)
- 30 students (10 per class)
- 6 teachers across subjects
- 5 sample tests with results
- Fee assignments (tuition + bus)

## RAG Pipeline Architecture

### 1. Document Indexing (`/functions/v1/upsert-embeddings`)

**Endpoint**: POST `/functions/v1/upsert-embeddings`

**Request Body**:
```json
{
  "doc_id": "optional-uuid-for-updates",
  "title": "Mathematics Chapter 5 Notes",
  "content": "Full text content...",
  "type": "note|intervention|syllabus|lesson_plan",
  "metadata": {
    "class_id": "uuid",
    "subject_id": "uuid"
  }
}
```

**Process**:
1. Authenticates user (admin/teacher only)
2. Generates embeddings via OpenAI ada-002
3. Upserts document with vector into `documents` table
4. Logs action in `audit_logs`

### 2. RAG Retrieval (`/functions/v1/rag-query`)

**Endpoint**: POST `/functions/v1/rag-query`

**Request Body**:
```json
{
  "query": "How is student X performing in Math?",
  "scope": "student|class|school",
  "target_id": "optional-student-or-class-uuid",
  "top_k": 5,
  "messages": []
}
```

**Process**:

a) **RBAC Enforcement**: Parents restricted to their own student data

b) **Structured Facts Retrieval**: 
   - Student scope: Calls `get_student_facts()` for:
     - `[ATTENDANCE]`: Present/absent days, percentage (last 30 days)
     - `[TESTS]`: Last 3 test results with scores
     - `[FEES]`: Due/paid amounts, pending count
     - `[PROFILE]`: Name, admission number, class
   - Class scope: Calls `get_class_facts()` for aggregate metrics

c) **Vector Search**: Retrieves top_k similar documents filtered by scope metadata

d) **LLM Prompt Construction**:
   - System prompt: "You are SchoolCare Assistant. Always be accurate, concise (<=150 words)..."
   - Structured facts with labeled sections
   - Retrieved documents as context
   - User query

e) **Response**: Streams AI answer with cited sources

### 3. CSV Export (`/functions/v1/export-csv`)

**Endpoint**: POST `/functions/v1/export-csv`

**Supported Scopes**:

#### Test Results Export
```json
{
  "scope": "test",
  "id": "test-uuid"
}
```
**Columns**: Student Name, Admission No, Class, Test Name, Subject, Date, Max Marks, Marks Obtained, Percent, Grade, Remark, Present

#### Class Summary Export
```json
{
  "scope": "class",
  "id": "class-uuid"
}
```
**Columns**: Student Name, Admission No, Attendance %, Avg Marks (Last 3), Tuition Due, Bus Due, Total Due, At Risk

#### Student Report Export
```json
{
  "scope": "student",
  "id": "student-uuid",
  "filters": {
    "month_start": "2024-01-01",
    "month_end": "2024-12-31"
  }
}
```
**Sections**:
- Student profile (name, admission number, class)
- Attendance summary with daily records
- Test results with scores and percentages
- Fee details with payment status

**RBAC**: Parents can only export their own student data

#### Monthly Summary Export
```json
{
  "scope": "month_summary",
  "filters": {
    "month": 11,
    "year": 2024
  }
}
```
**Columns**: Student Name, Admission No, Class, Attendance %, Tests Taken, Avg Score %, Fees Due, Fees Paid, At Risk

**RBAC**: Admin and teacher only

#### Attendance Export
```json
{
  "scope": "attendance",
  "filters": {
    "class_id": "class-uuid",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }
}
```
**Columns**: Date, Student Name, Admission No, Class, Status, Remarks

## UI Export Integration

### Test Details Page
- Export button in header → downloads complete test results CSV
- Includes all students with marks, percentages, grades, and attendance status

### Students Page
- Export button (download icon) per student row → downloads comprehensive student report
- Includes attendance history, test results, and fee details

### Classes Page
- Export button per class row → downloads class summary with all student metrics
- Shows attendance percentages, test averages, fee status, and at-risk indicators

### AI Assistant
- "Export Report" button in header → downloads current month's summary
- One-click access to school-wide monthly reports

## SQL Views & Functions

### `student_summary` View
Aggregates per student:
- `attendance_pct_30d`: Attendance % (last 30 days)
- `avg_test_score_pct`: Average test score %
- `fees_due`, `fees_paid`: Fee status
- `low_attendance_flag`, `low_grade_flag`: At-risk indicators

### `class_summary` View
Aggregates per class:
- `avg_attendance_pct`: Class average attendance
- `avg_test_score_pct`: Class average score
- `fee_collection_pct`: Fee collection %
- `at_risk_count`: Number of at-risk students

### Functions
- `get_student_facts(student_id, month_start, month_end)`: Returns JSON with student metrics
- `get_class_facts(class_id, month_start, month_end)`: Returns JSON with class metrics
- `match_documents(query_embedding, threshold, count)`: Vector similarity search

## API Routes (Edge Functions)

### `/functions/v1/rag-query` (Auth required)
AI assistant with RAG - queries with role-based structured facts

### `/functions/v1/upsert-embeddings` (Admin/Teacher only)
Upload and vectorize documents

### `/functions/v1/export-csv` (Auth required, RBAC enforced)
Export data to CSV with multiple scope options
- Streams CSV directly to client
- Enforces role-based access controls
- Logs all exports in audit trail

### `/functions/v1/audit-log` (Auth required)
Log user actions

## User Roles & RBAC

- **admin**: Full access to all features and data, can export all scopes
- **teacher**: Manage classes, tests, upload documents, query students in their classes, export class/test data
- **parent**: View only their own child's data, can export only their student's report

### RBAC in CSV Export:
- Parents: Only `scope=student` for their child
- Teachers: Access to their classes and tests
- Admins: Unrestricted access to all export scopes

### PII Protection:
- System prompt instructs AI to mask PII unless role permits
- Export endpoints verify user permissions before returning data
- All exports logged with user ID and scope

## System Prompt

```
You are SchoolCare Assistant. Always be accurate, concise (<=150 words), and helpful. 
Cite data sources with tags [ATTENDANCE], [TESTS], [FEES], [PROFILE]. 
Never invent numeric facts—if data is missing reply 'I don't have enough data' and 
indicate what to check. Mask PII unless the user role allows it. 
If student is at-risk, include one recommended action.
```

## Features

✅ Dashboard with analytics
✅ Student/Teacher/Class management
✅ Attendance tracking with CSV import
✅ Tests & Results with bulk entry
✅ Fee collection (tuition + bus)
✅ Transport management with routes
✅ **AI Assistant with RAG pipeline**
✅ **Structured fact retrieval (attendance, tests, fees)**
✅ **Document indexing with embeddings**
✅ **Vector similarity search**
✅ **Role-based access control (RBAC)**
✅ **CSV export with multiple scopes**
  - Test results with detailed columns
  - Class summaries with student metrics
  - Individual student comprehensive reports
  - Monthly summaries across school
  - Attendance records by class/date range
✅ **UI-integrated export buttons**
  - One-click exports from relevant pages
  - Automatic file naming with timestamps
  - Toast notifications for user feedback
✅ **Audit logging with field tracking**

## Development

```bash
npm install
npm run dev
```

## Testing CSV Export

### From UI:
1. **Test Details**: Click "Export CSV" button in header
2. **Students**: Click download icon on any student row
3. **Classes**: Click download icon on any class row
4. **AI Assistant**: Click "Export Report" button in header

### Via API:
```bash
# Export test results
curl -X POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/export-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scope": "test", "id": "test-uuid"}' \
  --output test_results.csv

# Export student report
curl -X POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/export-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scope": "student", "id": "student-uuid"}' \
  --output student_report.csv

# Export monthly summary
curl -X POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/export-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scope": "month_summary", "filters": {"month": 11, "year": 2024}}' \
  --output monthly_summary.csv
```

## Security Notes

⚠️ Current warnings (non-critical):
1. pgvector extension in public schema - acceptable for vector search
2. Password leak protection - enable in Supabase Dashboard > Auth settings

✅ All tables have RLS enabled with role-based policies
✅ RAG queries enforce RBAC at function level
✅ CSV exports enforce role-based permissions
✅ Parent access restricted to own student data
✅ PII masked by AI based on user role
✅ All queries and exports audited with field tracking

## Links

- Supabase Dashboard: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt
- Edge Functions: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt/functions
- Auth Settings: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt/auth/users
- Database: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt/editor
