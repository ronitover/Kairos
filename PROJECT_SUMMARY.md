# StudySync (Kairos) — Complete Project Summary

## 1. Title, Problem Statement & Idea

### Title
**StudySync — Departmental Digital Resource & Knowledge Hub**  
*(Repository name: **Kairos**; product branding in UI: **StudySync**)*

### Problem Statement
Educational institutions struggle with **fragmented academic resources**: notes, textbooks, and assignments are scattered across email, local drives, and informal channels. There is no single, role-aware platform where:

- **Students** can access approved materials by subject/semester, submit assignments, and contribute notes for verification.
- **Faculty** can publish official notes and textbooks, create/grade assignments, and act as gatekeepers for student-contributed content.
- **Administrators** can manage users, assign faculty to subjects, enroll students, publish circulars, and oversee the repository.

This leads to inconsistent access, no approval workflow for student uploads, poor discoverability, and no clear audit trail — affecting learning outcomes and institutional efficiency.

### Idea
Build a **centralized academic repository and learning management system** with:

1. **Role-based access** (Student, Faculty, Admin) with dedicated dashboards and workflows.
2. **Smart repository** — resources organized by programme, semester, and subject, with upload/download and format control (PDF, PPT/PPTX, DOC/DOCX, JPG/PNG).
3. **Gatekeeper system** — faculty (and admin) verify student-contributed “unofficial” notes before they become visible in the repository.
4. **Assignment lifecycle** — faculty create assignments; students submit; faculty grade and release results.
5. **Digital notice board** — department circulars and academic calendar events for students and faculty.
6. **Admin control** — faculty/student account management, subject–faculty assignment, student enrollment in subjects, and review of uploads.

The system aligns with the **TRACK-1** problem statement (as referenced in project documentation): a single portal that serves as the department’s digital resource and knowledge hub.

---

## 2. Features

### 2.1 Authentication & Users
- **Student**: Register (USN, name, programme, semester, email, password), login, forgot/reset password.
- **Faculty**: Login (no self-registration); role enforced by backend.
- **Admin**: Login; role enforced by backend.
- **Session**: JWT-style tokens, persisted in localStorage; profile hydration via `/me`; role stored in user metadata.
- **Route protection**: Path-based guards redirect unauthenticated or wrong-role users to the appropriate login or dashboard.

### 2.2 Student Features
- **Dashboard**: Programme/semester, circulars, subject selector, assignments (pending/submitted/graded), recent notes, textbooks, academic calendar (with assignment deadlines).
- **Repository**: Browse resources by semester/subject; access notes and textbooks (with preview placeholder).
- **Unofficial notes**: Upload notes (with file validation); status (pending/verified/rejected) visible after faculty verification.
- **Assignments**: View brief, submit file, view result and grade when released.
- **Calendar**: View academic events and assignment due dates.

### 2.3 Faculty Features
- **Dashboard**: Assigned subjects, upload official notes, create notifications and calendar events, manage textbooks, create assignments.
- **Verification (Gatekeeper)**: List pending unofficial notes; approve or reject with status update.
- **Textbooks**: Upload textbooks (title, author, edition, subject, file).
- **Assignments**: Create assignments (title, subject, instructions, marks, due date, resources); view submissions; grade and release grades.
- **Circulars**: Create notices and calendar events (visible to students/faculty/both).

### 2.4 Admin Features
- **Dashboard**: KPIs (students, faculty, subjects, pending verifications), activity feed, quick actions (add faculty, assign subjects, student accounts, enroll students, circulars, review uploads).
- **Faculty accounts**: List faculty (from service); add faculty (form wired to stub API); view faculty details (by id); block/activate (placeholder).
- **Student accounts**: List students; search/filter (programme, semester); apply/reset filters; select rows; export CSV; view student details (by id); deactivate selected / reset password / disable (placeholders).
- **Assign subjects**: List subjects (with programme/semester filter) and faculty; assign selected subjects to selected faculty (API wired).
- **Enroll students**: List subjects and students; enroll selected students in selected subject (API wired).
- **Circulars**: Create/edit/delete notices; create calendar events; delete admin events.
- **Review uploads**: List pending uploads (from service); approve/reject (local state); view (modal placeholder).
- **Placeholders**: Departments and System Settings (coming-soon screens).
- **Navigation**: Header with Dashboard, Faculty Accounts, Assign Subjects, Student Accounts, Circulars, Departments, System Settings; notifications dropdown.

### 2.5 Cross-Role / Shared
- **Department circulars**: Notices (title, content, urgent) and academic calendar events; audience (students/faculty/both); persisted in app state (localStorage).
- **File handling**: Validation (size, type); supported formats PDF, PPT/PPTX, DOC/DOCX, JPG/PNG.
- **Responsive UI**: Shared headers, footers, and layout patterns across roles.

---

## 3. Technical Approach

### 3.1 Frontend
- **Stack**: React 19, TypeScript, Vite 7.
- **State**: React state and `useEffect` for data fetching; `AuthContext` for user/session/role; localStorage for session and for circulars/calendar (app state).
- **Routing**: Path-based (no React Router); `path` state derived from `window.location`; `navigate(path)` updates history and state; role-based redirect in `useEffect`.
- **Services**: Centralized API layer (`src/services/`): `api.ts` (base client with Bearer token), `auth.ts`, `students.ts`, `faculty.ts`, `admin.ts`, `assignments.ts`. Backend is called where implemented; mocks used for dashboard/list endpoints not yet provided.
- **UI**: Single `App.tsx` with all screens; shared components (e.g. `CommonDashboardHeader`, `BrandIdentity`); Material Symbols icons; custom CSS (`App.css`).
- **File upload**: `validateFile` and file type/size checks; `FormData` for multipart uploads where backend supports it.

### 3.2 Backend
- **Stack**: Node.js, Express 5, Supabase (Auth + Postgres), Google Drive (optional) for file storage.
- **Auth**: Supabase Auth for sign-up/sign-in; role in `app_metadata` or `user_metadata`; role-specific login endpoints (`/api/auth/student/login`, `/api/auth/faculty/login`, `/api/auth/admin/login`); `requireAuth` and `requireRoles(...)` middleware.
- **Database**: PostgreSQL schema in `backend/sql/schema.sql`: users (Supabase), `students`, `faculty`, `admins`, `subjects`, `faculty_subjects`, `student_subjects`, `assignments`, `submissions`, `grades`, `notes`, `note_files`, `textbooks`, `textbook_files`, `activities`, etc.
- **APIs**: REST; documented in `API_ENDPOINTS.md`. Implemented: auth (register, login for all roles), `/me`, file upload/list/get/delete (Drive), subjects (get, assign to faculty, enroll students), notes (unofficial/official, list, verify), assignments (create, list, submit, submissions, grade).
- **Storage**: Google Drive via OAuth or service account; folder-per-subject; file metadata stored; backend returns file IDs/links.

### 3.3 Data Flow
- **Auth**: Login/register → backend returns user + session → frontend stores token and user → `getCurrentUserProfile()` (/me) hydrates profile (name, USN, department, etc.).
- **Resources**: Upload → backend resolves subject, uploads to Drive, writes DB rows (notes/textbooks/submissions) → frontend refetches or updates state.
- **Admin**: Dashboard/students/faculty use admin service (mock or real); assign subjects and enroll students call real backend endpoints.

### 3.4 Integration Readiness
- **Frontend**: Service layer is the single place to swap mocks for real API calls; forms collect and validate data; see `FRONTEND_INTEGRATION_READY.md` and `MISSING_REQUIREMENTS.md`.
- **Backend**: Schema and endpoints documented; Supabase and Drive need configuration (see `backend/README.md`).

---

## 4. Feasibility and Viability

### 4.1 Feasibility
- **Technical**: High. Stack is standard (React, Node, Postgres, Supabase, Drive); schema is detailed; most backend APIs exist; frontend is structured for integration.
- **Scope**: Manageable. Core flows (auth, repository, assignments, verification, circulars, admin) are implemented or stubbed; gaps are documented (unified repository/search page, strict route guards, exact TRACK-1 wording in places).
- **Dependencies**: Supabase and Google Drive require accounts and configuration; no exotic or high-risk dependencies.
- **Team**: Single codebase with clear separation (services, contexts, screens); backend has test checklists (Postman) and seed scripts for users.

### 4.2 Viability
- **Need**: Real: departments and institutions need a single, controlled place for course materials, assignments, and notices.
- **Users**: Clear roles (students, faculty, admin) with distinct value: students get one place for materials and submissions; faculty get verification and assignment tools; admin get control and visibility.
- **Sustainability**: Can be extended with more subjects, programmes, and features (e.g. analytics, audit logs) without fundamental rework; schema and API design support that.
- **Deployment**: Frontend (Vite build) and backend (Node) can be hosted on common platforms (Vercel/Netlify + Railway/Render, or institutional servers); Supabase and Drive are cloud services.

---

## 5. Impact and Benefits

### 5.1 For Students
- **Single access point** to approved notes, textbooks, and assignments by subject/semester.
- **Clear status** on unofficial note submissions (pending/verified/rejected).
- **Structured assignment flow**: view brief → submit → view result when released.
- **Awareness** of circulars and academic calendar in one place.

### 5.2 For Faculty
- **Gatekeeper role**: approve or reject student notes so only quality content is visible.
- **Official content**: publish notes and textbooks linked to subjects.
- **Assignment management**: create, collect submissions, grade, and release grades.
- **Communication**: post notices and events to students/faculty.

### 5.3 For Institution / Admin
- **Central control**: manage faculty and student accounts, assign faculty to subjects, enroll students.
- **Visibility**: dashboard with counts and activity; review uploads queue.
- **Consistency**: one platform for policy (circulars, calendar) and for repository governance.
- **Audit trail**: database and activity design support accountability (who uploaded, who verified, when).

### 5.4 Broader Impact
- **Quality**: Only verified content is shown as approved; reduces unreliable or duplicate material.
- **Efficiency**: Less time chasing files and notices across channels.
- **Scalability**: Same workflow for many subjects and programmes.
- **Alignment**: Meets TRACK-1 style requirements for a departmental digital resource and knowledge hub.

---

## 6. Research and References

### 6.1 Project Documentation (Internal)
- **DATABASE_SCHEMA.md** — Full PostgreSQL schema (users, students, faculty, admins, subjects, assignments, notes, textbooks, activities, etc.).
- **API_ENDPOINTS.md** — REST API specification (auth, files, subjects, notes, assignments, submissions, grades).
- **MISSING_REQUIREMENTS.md** — Gap analysis vs TRACK-1 (frontend): route protection, repository/search page, circulars module, role guards, backend wiring.
- **FRONTEND_INTEGRATION_READY.md** — Service layer, auth context, form readiness for backend integration.
- **BACKEND_IMPLEMENTATION_GUIDE.md** / **BACKEND_INTEGRATION_ANALYSIS.md** — Backend implementation and integration notes.
- **backend/README.md** — Setup (Supabase, Drive OAuth), run, seed users, API list, test checklists.

### 6.2 Problem Statement / Spec
- **TRACK-1.pdf** — Referenced in `MISSING_REQUIREMENTS.md` as the problem statement/specification. The project is designed to satisfy TRACK-1 requirements (smart repository, gatekeeper, search/filtering, digital notice board, role-based access).

### 6.3 Technologies
- **React** — [react.dev](https://react.dev)
- **Vite** — [vite.dev](https://vite.dev)
- **Supabase** — [supabase.com](https://supabase.com) (Auth, optional database)
- **Express** — [expressjs.com](https://expressjs.com)
- **Google Drive API** — [developers.google.com/drive](https://developers.google.com/drive) for file storage

### 6.4 Conceptual / Domain
- **Learning Management Systems (LMS)** — Centralized course and resource management.
- **Institutional repositories** — Curated, role-governed academic content.
- **Approval workflows** — Gatekeeper (faculty) verification of user-generated content before publication.
- **Role-based access control (RBAC)** — Student, Faculty, Admin with distinct permissions and UIs.

---

## Summary Table

| Aspect | Description |
|--------|-------------|
| **Title** | StudySync — Departmental Digital Resource & Knowledge Hub (Kairos) |
| **Problem** | Fragmented academic resources; no single, role-aware repository with approval workflow |
| **Idea** | Centralized LMS + repository with student/faculty/admin roles, gatekeeper verification, assignments, circulars |
| **Features** | Auth (3 roles), dashboards, repository, notes (official/unofficial + verify), assignments, circulars, admin tools |
| **Frontend** | React 19, TypeScript, Vite; path-based routing; service layer; AuthContext |
| **Backend** | Node, Express, Supabase Auth, Postgres schema, Google Drive (optional); REST API |
| **Feasibility** | High — standard stack, documented schema/API, integration-ready frontend |
| **Viability** | Strong — clear institutional need, defined users, extensible design |
| **Impact** | One place for materials and notices; quality control; audit trail; efficiency |
| **References** | TRACK-1 spec, DATABASE_SCHEMA, API_ENDPOINTS, MISSING_REQUIREMENTS, backend README |
