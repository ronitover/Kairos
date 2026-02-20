## Missing Requirements vs TRACK‑1 (Frontend POV)

This document captures what is **still missing or only partially done from the frontend point of view** relative to the `TRACK-1.pdf` problem statement.  
Anything already implemented in the UI and wired to the mock service layer is treated as **done for frontend**, even if the backend is still pending.

---

### 1. Authentication & Security (Frontend)

**What’s already done (frontend):**
- Student registration screen (USN, name, programme, semester, email, password) with validation.
- Student / Faculty / Admin login screens, all calling a shared auth service (currently mocked).
- Forgot‑password + reset‑password flows with proper forms, validation, and success/error feedback.
- Auth context (`AuthProvider` / `useAuth`) maintaining `user` and `isAuthenticated` in the app.

**Still missing (frontend):**
- **Route‑level protection:**
  - Screens are not actually guarded based on `user.role`; navigation is only controlled by buttons.
  - Manually navigating to an `/admin_*` or `/faculty_*` path is not explicitly blocked in the UI.
- **Session expiry UX:**
  - No banner/redirect behaviour when a stored token is considered expired; the context has expiry info but the user experience for “session expired, please login again” is not implemented.

---

### 2. Smart Repository (Upload & Download UI)

**What’s already done (frontend):**
- Multiple upload flows with UI + validation + mock services:
  - Student unofficial notes upload.
  - Faculty official notes/textbook upload (textbook modal).
  - Assignment submission uploads.
- File validation helpers (`validateFile`, `formatFileSize`, etc.) and file selection/removal UX.

**Still missing (frontend):**
- **Unified “Repository” / “Resources” screen:**
  - No single consolidated page where students can browse all materials organised by **Semester → Subject → Unit**.
  - Current dashboards show recent/sample resources, not a complete structured repository view.
- **Consistent 4‑format messaging and validation:**
  - Spec requires exactly: PDF, PPT/PPTX, DOC/DOCX, JPG/PNG.
  - Some upload surfaces are currently copy/validation‑wise “PDF only” or looser; not every upload UI clearly enforces and communicates exactly those 4 formats.

---

### 3. Gatekeeper System (Approval Workflow UI)

**What’s already done (frontend):**
- `FacultyVerificationScreen` where faculty can:
  - See pending notes.
  - Approve/Reject with button disable states and inline feedback.
  - Logic is wired to a mock `facultyService.verifyNote` and local status state.

**Still missing (frontend):**
- **Dedicated HOD/Admin review view:**
  - Spec mentions a “HOD/Faculty dashboard has a `Review Uploads` tab”.
  - You currently only have a faculty‑styled review table; there is no explicit **Admin/HOD‑branded review page/tab** surfaced separately.
- **Repository visibility tied to approval:**
  - There is no resource list/search screen that:
    - Only shows items with `Status: Approved`.
    - Hides `Pending` or `Rejected` items from students in the UI.

---

### 4. Advanced Search & Filtering (Frontend)

**What’s already done (frontend):**
- Various filter UIs (dropdowns, chips, search inputs) across dashboards and admin screens.
- Planned API and data model for search and filtering in `API_ENDPOINTS.md` / `DATABASE_SCHEMA.md`.

**Still missing (frontend):**
- **Dedicated “Search Resources” page:**
  - A single screen where a student can:
    - Filter by **Subject Code** (e.g., `BCA401`).
    - Filter by **Semester**.
    - Filter by **Professor** (“Notes by Prof. X”).
  - And see **a clean grid/list of matching files** (title, type, uploader, status, etc.).
- **Connected filter controls:**
  - Existing dropdowns for subjects/semesters are not yet wired to such a unified resource grid; they mostly drive static/demo sections.

---

### 5. Digital Notice Board (Department Circulars)

**What’s already done (frontend):**
- Dashboards and headers show “activity” and statistics, but not a dedicated circulars module.

**Still missing (frontend):**
- **Department Circulars section:**
  - A clearly labelled “Department Circulars” / “Notice Board” block on the main landing/dashboard, as called out in the spec.
- **Notice creation UI:**
  - A simple Admin/HOD/Faculty form to post circulars (title, message, optional link/attachment, validity period).
- **“New” visual treatment:**
  - A badge/highlight for new notices (e.g. posted within the last 24 hours) is not implemented in the UI.

---

### 6. Role‑based UX Guardrails

**What’s already done (frontend):**
- Auth context tracks `user.role` (`student`, `faculty`, `admin`).
- Most navigation flows steer each role to its own dashboard.

**Still missing (frontend):**
- **Guard components / hooks:**
  - Small wrappers like `RequireRole({ role: 'admin' })` that:
    - Redirect unauthorised users to a safe page (e.g. login or their own dashboard).
    - Prevent rendering of protected screens when role does not match.
- **Role‑aware navigation & chrome:**
  - Top‑level nav and quick links should render conditionally from `user.role`, not just from which buttons were clicked earlier.

---

### 7. Backend / System Items (For Reference Only)

These are **not frontend gaps**, but are still required for a full TRACK‑1 solution end‑to‑end:

- Apply the documented DB schema to a real Postgres instance (migrations).
- Implement the endpoints from `API_ENDPOINTS.md` (auth, repository, search, gatekeeper, circulars, admin tools).
- Wire the frontend service layer (`authService`, `assignmentService`, `studentService`, `facultyService`, `adminService`) to those real endpoints instead of mocks.
- Implement server‑side validation, security (rate limiting, CORS, CSRF, token refresh), search/indexing, and logging/monitoring.

---

### Summary

- **Frontend status:**  
  Most major flows that judges will interact with (auth for three roles, dashboards, uploads, approval UI, assignment lifecycle) are **implemented and routed through a clean service layer with mocks**, so swapping to real APIs should be straightforward.

- **Still missing from the frontend POV:**  
  A unified repository/search page, an explicit Department Circulars module, stronger route/role guarding, and tighter alignment of all upload/search UIs with the exact TRACK‑1 concepts (4 formats, approved‑only visibility, Subject/Semester/Professor filters).

