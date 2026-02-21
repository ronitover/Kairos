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

### Deploy frontend to Vercel

1. **Push your code** to GitHub (or GitLab/Bitbucket). Vercel will deploy from the repo.

2. **Connect the project**
   - Go to [vercel.com](https://vercel.com) and sign in.
   - **Add New** → **Project** → import your repo.
   - Vercel will detect Vite (or use the repo’s `vercel.json`). Confirm:
     - **Root Directory:** `./` (repo root)
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`

3. **Set environment variable**
   - In the project → **Settings** → **Environment Variables**, add:
   - **Name:** `VITE_API_URL`
   - **Value:** your backend API base URL, e.g. `https://your-ngrok-url.ngrok-free.app/api` (no trailing slash).
   - Apply to **Production** (and Preview if you want).

4. **Deploy**
   - **Deploy** (or push to the connected branch to trigger a new deploy).
   - After deploy, the app will be at `https://your-project.vercel.app`. All SPA routes work via `vercel.json` rewrites.

**CLI option:** Install Vercel CLI (`npm i -g vercel`), run `vercel` in the project root, follow the prompts, then set `VITE_API_URL` in the Vercel dashboard (or `vercel env add VITE_API_URL`).

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

## 6. Backend with ngrok (Vercel frontend + local backend, e.g. hackathon demo)

Expose your local backend so a frontend deployed on Vercel can call it.

### 6.1 Install ngrok

- **macOS (Homebrew):** `brew install ngrok`
- **Or:** sign up at [ngrok.com](https://ngrok.com), download the binary, and add it to your PATH.

### 6.2 Start your backend

```bash
cd backend
npm start
```

Backend should be listening on `http://localhost:4000`.

### 6.3 Start the tunnel

In a **second terminal**:

```bash
ngrok http 4000
```

You’ll see something like:

```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:4000
```

Copy the **HTTPS** URL (e.g. `https://abc123.ngrok-free.app`).

### 6.4 Allow your Vercel frontend in CORS

In `backend/.env`, set `CORS_ORIGIN` to your Vercel app (and optionally keep localhost for local dev):

```env
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:5173
```

Restart the backend after changing `.env`.

### 6.5 Point the frontend to the tunnel

In **Vercel** → your project → **Settings** → **Environment Variables**, add:

| Name           | Value                          |
|----------------|--------------------------------|
| `VITE_API_URL` | `https://abc123.ngrok-free.app/api` |

Use your actual ngrok URL; no trailing slash. Redeploy the frontend so the new value is used.

### 6.6 Demo checklist

1. Backend running: `cd backend && npm start`
2. ngrok running: `ngrok http 4000` (keep this terminal open)
3. Vercel env `VITE_API_URL` = your ngrok HTTPS URL + `/api`
4. Open your Vercel app; it will call your local backend through ngrok.

**Note:** Free ngrok URLs change each time you restart ngrok. If the URL changes, update `VITE_API_URL` in Vercel and redeploy.

---

**Summary:** Configure `backend/.env`, run the backend, set `VITE_API_URL` for the frontend, run `npm run build`, then serve `dist/` and proxy `/api` to the backend for a hosting-ready deployment.
