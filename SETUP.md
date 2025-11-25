# SchoolCare-AI Setup Guide

Full-stack school management system with AI-powered assistant, built with React + Supabase + Vector DB.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase Edge Functions (serverless)
- **Database**: PostgreSQL with pgvector extension
- **AI**: Lovable AI Gateway (pre-configured)
- **Auth**: Supabase Auth

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
- 5 sample tests
- Fee assignments (tuition + bus)

## API Routes (Edge Functions)

All automatically deployed:

### `/functions/v1/rag-query` (Auth required)
AI assistant with RAG - queries documents with role-based access
```bash
POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/rag-query
Body: { "query": "How is student X performing?", "messages": [] }
```

### `/functions/v1/upsert-embeddings` (Auth required)
Upload and vectorize documents (notes, syllabus, interventions)
```bash
POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/upsert-embeddings
Body: { "title": "Math Notes", "content": "...", "document_type": "note" }
```

### `/functions/v1/export-csv` (Auth required)
Export test results or attendance as CSV
```bash
POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/export-csv
Body: { "type": "test_results", "test_id": "uuid" }
```

### `/functions/v1/audit-log` (Auth required)
Log user actions for compliance
```bash
POST https://bwzlgevdcplryjygfsdt.supabase.co/functions/v1/audit-log
Body: { "action": "view_report", "resource_type": "test", "resource_id": "uuid" }
```

## User Roles

- **admin**: Full access to all features
- **teacher**: Manage classes, tests, attendance for their subjects
- **parent**: View their child's data only

## Features

✅ Dashboard with analytics
✅ Student/Teacher/Class management
✅ Attendance tracking with CSV import
✅ Tests & Results with bulk entry
✅ Fee collection (tuition + bus)
✅ Transport management with routes
✅ AI Assistant with RAG (role-based)
✅ Document store for teacher notes
✅ Audit logging
✅ CSV export

## Development

```bash
npm install
npm run dev
```

## Security Notes

⚠️ Current warnings (non-critical):
1. pgvector extension in public schema - acceptable for vector search
2. Password leak protection - enable in Supabase Dashboard > Auth settings

All tables have Row Level Security (RLS) enabled with role-based policies.

## Links

- Supabase Dashboard: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt
- Edge Functions Logs: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt/functions
- Auth Settings: https://supabase.com/dashboard/project/bwzlgevdcplryjygfsdt/auth/users
