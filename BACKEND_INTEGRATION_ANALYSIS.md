# Backend Integration Analysis - Kairos Project

## Executive Summary
This project has a complete frontend UI but **zero backend integration**. All forms, buttons, and data displays are static/mock. The application needs comprehensive API integration, authentication state management, and several missing screens/flows.

---

## 🔗 Faculty-Student Connection Analysis

### Current Flow (As Designed):
1. **Admin** assigns subjects to **Faculty** (`/admin_assign_subjects`)
2. **Faculty** creates assignments for their assigned subjects (`/faculty_create_assignment`)
3. **Students** see assignments for subjects they're enrolled in (`/student_dashboard`)
4. **Students** submit assignments (`/assignment_review`)
5. **Faculty** views submissions and grades them (`/faculty_assignment_submissions`, `/faculty_grade_submission`)

### ❌ **CRITICAL MISSING LINK: Student Enrollment**
**Problem**: There's no mechanism to enroll students in subjects/courses!
- Admin can assign subjects to faculty ✅
- But students cannot be enrolled in subjects ❌
- Without enrollment, students won't see assignments for their subjects

**Missing Screen**: `/admin_enroll_students` or similar
- Should allow admin to:
  - Select a subject/course
  - Select multiple students (by programme/semester)
  - Enroll them in the subject
  - View enrollment status

---

## 🚨 Critical Missing Backend Integration

### 1. **Authentication & Session Management**
**Status**: ❌ **NOT IMPLEMENTED**

**Missing**:
- No API calls in login/register forms
- No session storage (localStorage/sessionStorage)
- No authentication context/state management
- No token handling
- No protected routes
- No logout functionality

**Files Affected**:
- `src/App.tsx` - All login/register screens (lines 225-520)
- Need to add: Auth context, API service, session management

**Required Backend Endpoints** (Already exist):
- ✅ `POST /api/auth/student/register`
- ✅ `POST /api/auth/student/login`
- ✅ `POST /api/auth/faculty/login`
- ✅ `POST /api/auth/admin/login`

**Missing Backend Endpoints**:
- ❌ `POST /api/auth/logout`
- ❌ `POST /api/auth/refresh` (token refresh)
- ❌ `GET /api/auth/me` (get current user)

---

### 2. **Student Registration Form**
**Status**: ❌ **NOT CONNECTED**

**Location**: `src/App.tsx` lines 308-399

**Issues**:
- Form submission just navigates (`onLogin()`)
- No API call to `/api/auth/student/register`
- No form validation feedback
- No error handling
- No loading states

**Required Fields** (form has them, but not submitted):
- `fullName`
- `usn`
- `programme`
- `semester`
- `email`
- `password`
- `confirmPassword` (needs validation)

---

### 3. **All Login Forms**
**Status**: ❌ **NOT CONNECTED**

**Locations**:
- Student Login: `src/App.tsx` lines 225-305
- Faculty Login: `src/App.tsx` lines 401-462
- Admin Login: `src/App.tsx` lines 464-520

**Issues**:
- All forms just call `onLogin()` which only navigates
- No API calls to respective endpoints
- No error messages displayed
- No loading states
- No password visibility toggle functionality

---

### 4. **Dashboard Data Fetching**
**Status**: ❌ **ALL STATIC DATA**

**Affected Screens**:
- `/student_dashboard` - Shows hardcoded assignments, notes, textbooks
- `/faculty_dashboard` - Shows hardcoded courses, notes, assignments
- `/admin_dashboard` - Shows hardcoded stats and activities

**Missing API Endpoints**:
- ❌ `GET /api/students/dashboard` - Student's assignments, notes, enrolled subjects
- ❌ `GET /api/faculty/dashboard` - Faculty's courses, assignments, pending verifications
- ❌ `GET /api/admin/dashboard` - System stats, recent activities

---

### 5. **Subject/Course Management**
**Status**: ❌ **NO BACKEND INTEGRATION**

**Admin Assign Subjects Screen** (`/admin_assign_subjects`):
- Lines 1224-1365
- Has UI to select faculty and subjects
- "Assign Selected Subjects" button does nothing
- No API call to save assignments

**Missing API Endpoints**:
- ❌ `GET /api/subjects` - List all subjects
- ❌ `GET /api/faculty/:facultyId/subjects` - Get faculty's assigned subjects
- ❌ `POST /api/faculty/:facultyId/subjects` - Assign subjects to faculty
- ❌ `DELETE /api/faculty/:facultyId/subjects/:subjectId` - Remove subject assignment

**Missing Feature**: Student Enrollment
- ❌ `GET /api/subjects/:subjectId/students` - Get enrolled students
- ❌ `POST /api/subjects/:subjectId/enroll` - Enroll students in subject
- ❌ `DELETE /api/subjects/:subjectId/enroll/:studentId` - Unenroll student

---

### 6. **Assignment Management**
**Status**: ❌ **NO BACKEND INTEGRATION**

**Faculty Create Assignment** (`/faculty_create_assignment`):
- Lines 2337-2464
- Form has all fields but no submission handler
- No file upload functionality
- No API integration

**Missing API Endpoints**:
- ❌ `POST /api/assignments` - Create assignment
- ❌ `GET /api/assignments` - List assignments (with filters)
- ❌ `GET /api/assignments/:id` - Get assignment details
- ❌ `PUT /api/assignments/:id` - Update assignment
- ❌ `DELETE /api/assignments/:id` - Delete assignment
- ❌ `GET /api/subjects/:subjectId/assignments` - Get assignments for a subject

**Student Assignment Review** (`/assignment_review`):
- Lines 3137-3281
- File upload UI exists but no functionality
- Submit button does nothing
- No API calls

**Missing API Endpoints**:
- ❌ `POST /api/assignments/:id/submit` - Submit assignment
- ❌ `GET /api/assignments/:id/submission` - Get student's submission
- ❌ `PUT /api/assignments/:id/submission` - Update submission (before deadline)

---

### 7. **Assignment Submissions & Grading**
**Status**: ❌ **NO BACKEND INTEGRATION**

**Faculty Assignment Submissions** (`/faculty_assignment_submissions`):
- Lines 2465-2716
- Shows hardcoded submission list
- "Release Grades" button does nothing
- No filtering/search functionality

**Faculty Grade Submission** (`/faculty_grade_submission`):
- Lines 2718-2901
- Form exists but no submission handler
- No API integration

**Missing API Endpoints**:
- ❌ `GET /api/assignments/:id/submissions` - Get all submissions for assignment
- ❌ `GET /api/submissions/:id` - Get submission details
- ❌ `POST /api/submissions/:id/grade` - Grade a submission
- ❌ `PUT /api/submissions/:id/grade` - Update grade
- ❌ `POST /api/assignments/:id/release-grades` - Release grades to students

---

### 8. **Notes Management**
**Status**: ❌ **NO BACKEND INTEGRATION**

**Faculty Upload Notes** (`/faculty_dashboard`):
- Lines 1445-1480
- Upload button opens modal but no file upload
- No API integration

**Student Notes Upload** (`/student_dashboard`):
- Lines 1781-1784
- Upload button does nothing

**Faculty Verification** (`/faculty_verification`):
- Lines 1949-2155
- Shows hardcoded student notes
- Verify/Reject buttons do nothing

**Missing API Endpoints**:
- ❌ `POST /api/notes/official` - Upload official notes (faculty)
- ❌ `POST /api/notes/unofficial` - Upload unofficial notes (student)
- ❌ `GET /api/notes/official` - Get official notes
- ❌ `GET /api/notes/unofficial` - Get unofficial notes (pending/verified)
- ❌ `POST /api/notes/:id/verify` - Verify student note
- ❌ `POST /api/notes/:id/reject` - Reject student note
- ❌ `GET /api/notes/:id/download` - Download note file

---

### 9. **Textbook Management**
**Status**: ❌ **NO BACKEND INTEGRATION**

**Faculty Textbook Upload** (`/faculty_textbook_upload`):
- Lines 2156-2335
- Form exists but no submission
- No file upload functionality

**Missing API Endpoints**:
- ❌ `POST /api/textbooks` - Upload textbook
- ❌ `GET /api/textbooks` - List textbooks
- ❌ `GET /api/subjects/:subjectId/textbooks` - Get textbooks for subject
- ❌ `GET /api/textbooks/:id/download` - Download textbook

---

### 10. **Student & Faculty Account Management**
**Status**: ❌ **NO BACKEND INTEGRATION**

**Admin Student Accounts** (`/admin_student_accounts`):
- Lines 769-998
- Shows hardcoded student list
- View/Reset Password/Disable buttons do nothing
- Search/filter not functional
- Pagination not functional

**Admin Faculty Accounts** (`/admin_faculty_accounts`):
- Lines 1000-1223
- Similar issues as student accounts

**Missing API Endpoints**:
- ❌ `GET /api/admin/students` - List students (with filters)
- ❌ `GET /api/admin/students/:id` - Get student details
- ❌ `POST /api/admin/students` - Create student account
- ❌ `PUT /api/admin/students/:id` - Update student
- ❌ `POST /api/admin/students/:id/disable` - Disable account
- ❌ `POST /api/admin/students/:id/enable` - Enable account
- ❌ `POST /api/admin/students/:id/reset-password` - Reset password
- ❌ `GET /api/admin/faculty` - List faculty
- ❌ `POST /api/admin/faculty` - Create faculty account
- ❌ `PUT /api/admin/faculty/:id` - Update faculty
- ❌ `POST /api/admin/faculty/:id/disable` - Disable account

---

## 🎨 Missing Screens/Flows

### 1. **Student Enrollment Screen** ⚠️ **CRITICAL**
**Route**: `/admin_enroll_students` (doesn't exist)

**Purpose**: Enroll students in subjects/courses

**Required Features**:
- Select subject/course
- Filter students by programme/semester
- Multi-select students
- Bulk enrollment
- View current enrollments
- Remove enrollment

**Why Critical**: Without this, students cannot see assignments for subjects!

---

### 2. **View Student Details Screen**
**Route**: Doesn't exist (button exists in `/admin_student_accounts`)

**Purpose**: View detailed student information

**Should Show**:
- Personal info (name, USN, email, programme, semester)
- Enrolled subjects
- Assignment submissions history
- Notes uploaded
- Account status

---

### 3. **View Faculty Details Screen**
**Route**: Doesn't exist (button exists in `/admin_faculty_accounts`)

**Purpose**: View detailed faculty information

**Should Show**:
- Personal info
- Assigned subjects
- Created assignments
- Active students count

---

### 4. **Password Reset Flow**
**Status**: Link exists but no screen

**Location**: `src/App.tsx` line 296 (`/student_login`)

**Missing**:
- Password reset request screen
- Password reset confirmation screen
- Email verification flow

**Missing API Endpoints**:
- ❌ `POST /api/auth/forgot-password` - Request password reset
- ❌ `POST /api/auth/reset-password` - Reset password with token

---

### 5. **Assignment Details View (Student)**
**Status**: Partially exists

**Current**: `/assignment_review` shows assignment details
**Issue**: No way to navigate back to dashboard easily
**Missing**: Breadcrumb navigation not functional

---

### 6. **Error/Success Message Display**
**Status**: ❌ **NOT IMPLEMENTED**

**Missing**:
- Toast notifications
- Error message display components
- Success message display
- Loading spinners/indicators

---

## 🔧 Non-Responsive/Broken Buttons

### All Form Submit Buttons
- Student Register: Line 382 - Just navigates
- Student Login: Line 280 - Just navigates
- Faculty Login: Line 456 - Just navigates
- Admin Login: Line 510 - Just navigates
- Faculty Create Assignment: No submit handler
- Faculty Textbook Upload: Line 2311 - No submit handler
- Assignment Submit: Line 3247 - No submit handler

### Action Buttons
- Admin "Assign Selected Subjects": Line 1349 - Does nothing
- Admin "View Details": Lines 928, 959 - No screen to navigate to
- Admin "Reset Password": Lines 931, 962 - No functionality
- Admin "Disable/Enable Account": Lines 934, 965 - No API call
- Faculty "Release Grades": Line 2507 - No functionality
- Faculty "Verify/Reject" notes: No handlers
- Student "Upload Notes": Line 1781 - No functionality
- All "Download" buttons: No file download functionality
- All "Export CSV" buttons: No export functionality

### Search/Filter Functionality
- All search inputs: Not connected to any filtering logic
- All filter dropdowns: Not functional
- Pagination: UI exists but not functional

---

## 📋 Required Infrastructure

### 1. **API Service Layer**
**Status**: ❌ **MISSING**

**Need to Create**:
- `src/services/api.ts` - Base API client with auth headers
- `src/services/auth.ts` - Authentication API calls
- `src/services/assignments.ts` - Assignment API calls
- `src/services/students.ts` - Student API calls
- `src/services/faculty.ts` - Faculty API calls
- `src/services/admin.ts` - Admin API calls
- `src/services/notes.ts` - Notes API calls
- `src/services/textbooks.ts` - Textbook API calls

### 2. **State Management**
**Status**: ❌ **MISSING**

**Options**:
- React Context API for auth state
- Or Zustand/Redux for global state
- Local state for component-specific data

**Required State**:
- Authentication (user, token, session)
- Current user profile
- Dashboard data caching
- Form states (loading, errors)

### 3. **File Upload Handling**
**Status**: ❌ **MISSING**

**Required**:
- File upload component/service
- Progress indicators
- File validation (size, type)
- Preview functionality

### 4. **Error Handling**
**Status**: ❌ **MISSING**

**Required**:
- Global error boundary
- API error handling
- Form validation
- User-friendly error messages

### 5. **Loading States**
**Status**: ❌ **MISSING**

**Required**:
- Loading spinners
- Skeleton screens
- Button loading states
- Page-level loading

---

## 🗄️ Database Schema Requirements

Based on the UI, you'll need these tables:

1. **users** (handled by Supabase Auth)
2. **subjects** - Courses/subjects
3. **faculty_subjects** - Many-to-many: Faculty assigned to subjects
4. **student_subjects** - Many-to-many: Students enrolled in subjects ⚠️ **CRITICAL MISSING**
5. **assignments** - Assignment details
6. **submissions** - Student assignment submissions
7. **grades** - Grading information
8. **notes** - Official and unofficial notes
9. **textbooks** - Textbook resources
10. **faculty** - Faculty profile (extends user)
11. **students** - Student profile (extends user)

---

## ✅ What's Working (UI Only)

- ✅ All screen layouts and designs
- ✅ Navigation between screens
- ✅ Form UI components
- ✅ Table displays
- ✅ Modal dialogs
- ✅ Responsive design (mostly)
- ✅ Material Icons integration

---

## 🎯 Priority Order for Backend Integration

### **Phase 1: Critical Foundation** (Must Have)
1. ✅ Authentication & Session Management
2. ✅ Student Registration API integration
3. ✅ All Login forms API integration
4. ✅ Protected routes
5. ✅ Student Enrollment System ⚠️ **CRITICAL MISSING FEATURE**

### **Phase 2: Core Features** (High Priority)
6. ✅ Subject/Course Management APIs
7. ✅ Assignment Creation & Management
8. ✅ Assignment Submission
9. ✅ Assignment Grading

### **Phase 3: Supporting Features** (Medium Priority)
10. ✅ Notes Management (upload, verify, download)
11. ✅ Textbook Management
12. ✅ Dashboard Data Fetching
13. ✅ Account Management (admin)

### **Phase 4: Polish** (Nice to Have)
14. ✅ Search & Filter functionality
15. ✅ Pagination
16. ✅ File downloads
17. ✅ CSV exports
18. ✅ Password reset flow
19. ✅ Error handling & loading states

---

## 📝 Summary

**Total Screens**: 20+ ✅
**Screens with Backend Integration**: 0 ❌
**API Endpoints Implemented**: 4 (auth only)
**API Endpoints Needed**: ~50+
**Missing Critical Features**: Student Enrollment System
**Forms Connected**: 0/10+
**Buttons Functional**: ~5% (navigation only)

**The frontend is production-ready from a UI perspective, but needs complete backend integration to be functional.**
