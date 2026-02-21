# Kairos – Deployment & Hosting

This document describes how to build and run the Kairos platform for production (hosting-ready).

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Supabase** project (for auth and database)
- **Google Drive** (optional): OAuth credentials or service account for file storage

## 1. Backend

### Environment

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default 4000) | Server port |
| `CORS_ORIGIN` | No | Allowed origin(s), comma-separated (e.g. `https://your-app.com`) |
| `SUPABASE_URL` | **Yes** | Supabase project URL |
| `SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** for DB features | Service role key (admin) |
| `MAX_UPLOAD_SIZE_MB` | No | Max upload size in MB (default 10) |
| `GOOGLE_OAUTH_*` or `GOOGLE_SERVICE_ACCOUNT_*` | For file uploads | Google Drive config |
| `GOOGLE_DRIVE_PARENT_FOLDER_ID` | Optional | Root folder ID in Drive |

The backend fails to start if `SUPABASE_URL` or `SUPABASE_ANON_KEY` is missing.

### Run

```bash
cd backend
npm install
npm start
```

- **Development (watch):** `npm run dev`

## 2. Frontend

### Build

Set the API base URL for production:

- **Option A – build-time env**  
  Create `.env.production` in the project root (or set in CI):

  ```env
  VITE_API_URL=https://your-api.example.com/api
  ```

- **Option B – default**  
  If unset, the app uses `http://localhost:4000/api` (suitable for local or same-origin proxy).

Then build:

```bash
npm install
npm run build
```

Output is in `dist/`.

### Serve

- **Preview (local):** `npm run preview` (serves `dist/` with Vite).
- **Production:** Serve the `dist/` directory with any static host (Nginx, Vercel, Netlify, S3 + CloudFront, etc.). Ensure:
  - All routes (e.g. `/admin_dashboard`, `/student_dashboard`) are served by `index.html` (SPA fallback).
  - `VITE_API_URL` points to your deployed backend URL.

## 3. Full-Stack (single machine)

1. Build frontend: `npm run build`
2. Start backend: `cd backend && npm start`
3. Serve frontend: `npm run preview` (or point Nginx to `dist/` and proxy `/api` to backend).

For production, use a reverse proxy (e.g. Nginx) to serve `dist/` and proxy `https://your-domain.com/api` to the Node backend.

## 4. Health check

- **Backend:** `GET http://localhost:4000/health` → `{ "ok": true }`
- Use this for load balancers or container health checks.

## 5. Database

Apply the schema in `backend/sql/schema.sql` (and any migrations) in your Supabase SQL editor. Seed admin/faculty users if needed via `backend/scripts/seed-users.js` (configure with `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`).

---

**Summary:** Configure `backend/.env`, run the backend, set `VITE_API_URL` for the frontend, run `npm run build`, then serve `dist/` and proxy `/api` to the backend for a hosting-ready deployment.
