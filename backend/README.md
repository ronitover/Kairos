# Backend Setup

## Stack
- Node.js
- Express
- Supabase Auth

## Configure
1. Copy `backend/.env.example` to `backend/.env`.
2. Fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` from your Supabase project.
3. Fill `SUPABASE_SERVICE_ROLE_KEY` (required for DB table writes from backend).
4. Keep `CORS_ORIGIN` as `http://localhost:5173` for local Vite frontend.
5. Never commit `backend/.env` with real keys.
6. Configure Google Drive using OAuth2 (recommended for personal Google accounts):
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REDIRECT_URI` (default: `http://localhost:4000/api/drive/oauth/callback`)
   - optional initial `GOOGLE_OAUTH_REFRESH_TOKEN`
7. Set `GOOGLE_DRIVE_PARENT_FOLDER_ID` to the folder where uploads should be stored.
8. One-time OAuth setup flow:
   - Open `GET /api/drive/oauth/url` and copy the URL.
   - Complete Google consent in browser.
   - Copy the `code` query parameter from redirect URL.
   - Call `POST /api/drive/oauth/exchange-code` with `{ "code": "<your_code>" }`.
   - Save returned `refreshToken` into `GOOGLE_OAUTH_REFRESH_TOKEN` in `.env`.
   - Restart backend.
9. Run DB schema once in Supabase SQL Editor:
   - Execute `backend/sql/schema.sql`

## Run
```bash
cd backend
npm install
npm run dev
```

## Seed Faculty/Admin Users (No hardcoding in app)
1. Copy template and edit users:
```bash
cd backend
copy scripts\\seed-users.template.json scripts\\seed-users.json
```
2. Fill entries (faculty/admin records with email/password/name).
3. Run:
```bash
npm run seed:users
```
4. Optional custom input file:
```bash
node scripts/seed-users.js scripts/your-users.json
```

This creates Auth users and upserts profile rows into `faculty` / `admins`.

## API
- `POST /api/auth/student/register`
- `POST /api/auth/student/login`
- `POST /api/auth/faculty/login`
- `POST /api/auth/admin/login`
- `GET /api/me` (Bearer token required)
- `GET /api/drive/oauth/url`
- `GET /api/drive/oauth/callback`
- `POST /api/drive/oauth/exchange-code`
- `POST /api/files/upload` (Bearer token + multipart/form-data key: `file`)
- `GET /api/files` (Bearer token)
- `GET /api/files/:fileId` (Bearer token)
- `DELETE /api/files/:fileId` (Bearer token)
- `GET /api/subjects`
- `POST /api/faculty/:facultyId/subjects` (admin only)
- `POST /api/subjects/:subjectId/enroll` (admin only)
- `GET /api/subjects/:subjectId/students` (faculty/admin only)
- `POST /api/notes/unofficial` (student only, file required)
- `POST /api/notes/official` (faculty/admin only, file required)
- `GET /api/notes` (role-aware list, supports `type`, `status`, `subjectName`)
- `PATCH /api/notes/:noteId/verify` (faculty/admin only)
- `POST /api/assignments` (faculty/admin only)
- `GET /api/assignments`
- `POST /api/assignments/:assignmentId/submit` (student only, file required)
- `GET /api/assignments/:assignmentId/submissions` (faculty/admin only)
- `PATCH /api/submissions/:submissionId/grade` (faculty/admin only)
- `GET /health`

## Step 1 Test Checklist (Postman)
1. `GET /health` returns `200` and `{ "ok": true }`.
2. `POST /api/auth/student/register` returns `201` for a valid payload.
3. `POST /api/auth/student/login` returns `200` and session tokens.
4. `POST /api/auth/faculty/login` returns:
   - `200` when role is `faculty`
   - `403` when role is not `faculty`
5. `POST /api/auth/admin/login` returns:
   - `200` when role is `admin`
   - `403` when role is not `admin`

## Step 2 Test Checklist (Postman)
1. Login using any valid role endpoint and copy `session.accessToken`.
2. `GET /api/me` with header `Authorization: Bearer <accessToken>` returns `200` and user object.
3. `GET /api/me` without auth header returns `401`.
4. `GET /api/me` with invalid/expired token returns `401`.

## Step 3 Test Checklist (Postman)
1. Complete OAuth setup:
   - `GET /api/drive/oauth/url`
   - `POST /api/drive/oauth/exchange-code`
   - Save `refreshToken` in `.env` and restart backend.
2. Get access token from login (`session.accessToken`).
3. `POST /api/files/upload`
   - Headers: `Authorization: Bearer <accessToken>`
   - Body: `form-data`
   - Key: `file` (type `File`)
   - Optional text fields: `fileName`, `category`, `folderId`, `subjectName`
   - If `subjectName` is sent, backend creates/reuses a subject folder and uploads file inside it.
   - Expect `201` and returned Drive file metadata.
4. `GET /api/files` with Bearer token
   - Student should see own uploads.
   - Faculty/Admin can see all files uploaded in the configured parent folder.
   - Optional query: `subjectName` to filter files by subject.
5. `GET /api/files/:fileId` with Bearer token
   - `200` when access allowed.
   - `403` for unauthorized file access.
6. `DELETE /api/files/:fileId` with Bearer token
   - `200` for owner/faculty/admin.
   - `403` for unauthorized delete.

## Step 4 Test Checklist (Postman)
1. Faculty/admin login and create assignment:
   - `POST /api/assignments`
   - Body JSON: `title`, `subjectName`, `dueAt`, `maxMarks`, optional `description`
2. Student submit assignment:
   - `POST /api/assignments/:assignmentId/submit`
   - Body form-data with `file`, optional `fileName`
3. Faculty/admin fetch submissions:
   - `GET /api/assignments/:assignmentId/submissions`
4. Faculty/admin grade one submission:
   - `PATCH /api/submissions/:submissionId/grade`
   - Body JSON: `marks`, optional `grade`, optional `feedback`
5. Student upload unofficial note:
   - `POST /api/notes/unofficial`
   - Body form-data with `file`, `subjectName`, optional `title`
6. Faculty/admin upload official note:
   - `POST /api/notes/official`
   - Body form-data with `file`, `subjectName`, optional `title`
7. Faculty/admin verify unofficial note:
   - `PATCH /api/notes/:noteId/verify`
   - Body JSON: `status` (`approved` or `rejected`), optional `reviewerComment`
8. List notes:
   - `GET /api/notes`
   - Optional query filters: `type`, `status`, `subjectName`

## Role Notes
- Student registration stores `role: "student"` in user metadata.
- Faculty/Admin login checks `app_metadata.role` first, then `user_metadata.role`.
- For faculty/admin users, set role to `faculty` or `admin` in Supabase user metadata or app metadata.
