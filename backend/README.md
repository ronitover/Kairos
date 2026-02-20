# Backend Setup

## Stack
- Node.js
- Express
- Supabase Auth

## Configure
1. Copy `backend/.env.example` to `backend/.env`.
2. Fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` from your Supabase project.
3. Keep `CORS_ORIGIN` as `http://localhost:5173` for local Vite frontend.

## Run
```bash
cd backend
npm install
npm run dev
```

## API
- `POST /api/auth/student/register`
- `POST /api/auth/student/login`
- `POST /api/auth/faculty/login`
- `POST /api/auth/admin/login`
- `GET /health`

## Role Notes
- Student registration stores `role: "student"` in user metadata.
- Faculty/Admin login checks `app_metadata.role` first, then `user_metadata.role`.
- For faculty/admin users, set role to `faculty` or `admin` in Supabase user metadata or app metadata.
