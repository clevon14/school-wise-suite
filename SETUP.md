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

**Response Format**:
```
Streaming text/event-stream with:
- Answer citing [ATTENDANCE], [TESTS], [FEES] tags
- At-risk alerts with recommended actions
```

**Audit Logging**: Every query logged with:
```json
{
  "user_id": "uuid",
  "action": "ai_query",
  "scope": "student",
  "fields_returned": ["attendance", "tests", "fees"],
  "docs_retrieved": 3
}
```

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
```bash
POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/rag-query
Body: { 
  "query": "How is student X performing?",
  "scope": "student",
  "target_id": "student-uuid",
  "top_k": 5
}
```

### `/functions/v1/upsert-embeddings` (Admin/Teacher only)
Upload and vectorize documents
```bash
POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/upsert-embeddings
Body: { 
  "title": "Math Notes",
  "content": "...",
  "type": "note",
  "metadata": { "class_id": "uuid" }
}
```

### `/functions/v1/export-csv` (Auth required)
Export test results or attendance
```bash
POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/export-csv
Body: { "type": "test_results", "test_id": "uuid" }
```

### `/functions/v1/audit-log` (Auth required)
Log user actions
```bash
POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/audit-log
Body: { 
  "action": "view_report",
  "resource_type": "test",
  "resource_id": "uuid"
}
```

## User Roles & RBAC

- **admin**: Full access to all features and data
- **teacher**: Manage classes, tests, upload documents, query students in their classes
- **parent**: View only their own child's data, restricted RAG queries

### RBAC in RAG:
- Parents: `scope=student` only for their child, auto-enforced
- Teachers: Access students in their classes
- Admins: Unrestricted access

### PII Masking:
- System prompt instructs AI to mask PII unless role permits
- Only necessary fields returned based on role

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
✅ **Audit logging with field tracking**
✅ CSV export

## Development

```bash
npm install
npm run dev
```

## Testing RAG Pipeline

1. **Upload a document** (as admin/teacher):
```bash
curl -X POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/upsert-embeddings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Math Chapter 1 Notes",
    "content": "Algebra basics: equations, variables...",
    "type": "note",
    "metadata": {"class_id": "class-uuid"}
  }'
```

2. **Query the AI assistant**:
```bash
curl -X POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/rag-query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain algebra basics",
    "scope": "school",
    "top_k": 3
  }'
```

3. **Query with student facts**:
```bash
curl -X POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/rag-query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How is this student doing?",
    "scope": "student",
    "target_id": "student-uuid"
  }'
```

## Security Notes

⚠️ Current warnings (non-critical):
1. pgvector extension in public schema - acceptable for vector search
2. Password leak protection - enable in Supabase Dashboard > Auth settings

✅ All tables have RLS enabled with role-based policies
✅ RAG queries enforce RBAC at function level
✅ Parent access restricted to own student data
✅ PII masked by AI based on user role
✅ All queries audited with field tracking

## Links

- Supabase Dashboard: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt
- Edge Functions: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt/functions
- Auth Settings: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt/auth/users
- Database: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt/editor
