# Database Schema Documentation

This document outlines the complete database schema for the Kairos Academic Repository system. The schema is designed to be implemented using PostgreSQL (recommended) or any SQL database.

---

## Table Relationships Overview

```
users (Supabase Auth)
  ├── students (extends users)
  ├── faculty (extends users)
  └── admins (extends users)

subjects
  ├── faculty_subjects (many-to-many)
  └── student_subjects (many-to-many)

assignments
  └── submissions
      └── grades

notes
  └── note_files

textbooks
  └── textbook_files
```

---

## Core Tables

### 1. `users` (Supabase Auth Table)
**Note**: This table is managed by Supabase Auth. We store additional user data in role-specific tables.

**Columns** (managed by Supabase):
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password_hash` (String)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `email_confirmed_at` (Timestamp)
- `app_metadata` (JSONB) - Stores role: `student`, `faculty`, `admin`
- `user_metadata` (JSONB) - Additional user data

---

### 2. `students`
Extends users table with student-specific information.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  usn VARCHAR(50) UNIQUE NOT NULL,
  programme VARCHAR(255) NOT NULL,
  semester VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_usn ON students(usn);
CREATE INDEX idx_students_programme ON students(programme);
CREATE INDEX idx_students_semester ON students(semester);
CREATE INDEX idx_students_status ON students(status);
```

**Fields:**
- `id` - References users.id
- `full_name` - Student's full name
- `usn` - Unique Student Number (unique constraint)
- `programme` - e.g., "Computer Science & Engineering"
- `semester` - e.g., "6", "6th Sem"
- `status` - Account status: `active` or `disabled`
- `registered_at` - Registration timestamp
- `updated_at` - Last update timestamp

---

### 3. `faculty`
Extends users table with faculty-specific information.

```sql
CREATE TABLE faculty (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  designation VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faculty_department ON faculty(department);
CREATE INDEX idx_faculty_status ON faculty(status);
```

**Fields:**
- `id` - References users.id
- `name` - Faculty member's name
- `department` - Department name
- `designation` - e.g., "Senior Professor", "Assistant Professor"
- `status` - Account status: `active` or `disabled`
- `join_date` - When faculty joined
- `updated_at` - Last update timestamp

---

### 4. `admins`
Extends users table with admin-specific information.

```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - References users.id
- `name` - Admin's name
- `role` - Admin role: `admin` or `super_admin`
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

## Subject & Enrollment Tables

### 5. `subjects`
Stores all subjects/courses.

```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  programme VARCHAR(255) NOT NULL,
  semester VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_code ON subjects(code);
CREATE INDEX idx_subjects_programme ON subjects(programme);
CREATE INDEX idx_subjects_semester ON subjects(semester);
```

**Fields:**
- `id` - Primary key
- `code` - Subject code (unique), e.g., "CS501", "CS-401"
- `name` - Subject name
- `programme` - Programme this subject belongs to
- `semester` - Semester this subject is offered
- `description` - Optional description
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 6. `faculty_subjects`
Many-to-many relationship: Faculty assigned to subjects.

```sql
CREATE TABLE faculty_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(faculty_id, subject_id)
);

CREATE INDEX idx_faculty_subjects_faculty ON faculty_subjects(faculty_id);
CREATE INDEX idx_faculty_subjects_subject ON faculty_subjects(subject_id);
```

**Fields:**
- `id` - Primary key
- `faculty_id` - References faculty.id
- `subject_id` - References subjects.id
- `assigned_at` - Assignment timestamp
- Unique constraint on (faculty_id, subject_id)

---

### 7. `student_subjects`
Many-to-many relationship: Students enrolled in subjects.

```sql
CREATE TABLE student_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped')),
  UNIQUE(student_id, subject_id)
);

CREATE INDEX idx_student_subjects_student ON student_subjects(student_id);
CREATE INDEX idx_student_subjects_subject ON student_subjects(subject_id);
CREATE INDEX idx_student_subjects_status ON student_subjects(status);
```

**Fields:**
- `id` - Primary key
- `student_id` - References students.id
- `subject_id` - References subjects.id
- `enrolled_at` - Enrollment timestamp
- `status` - Enrollment status: `active` or `dropped`
- Unique constraint on (student_id, subject_id)

---

## Assignment Tables

### 8. `assignments`
Stores assignment details created by faculty.

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  instructions TEXT NOT NULL,
  total_marks INTEGER NOT NULL CHECK (total_marks > 0),
  due_date TIMESTAMP NOT NULL,
  allow_late_submission BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_subject ON assignments(subject_id);
CREATE INDEX idx_assignments_faculty ON assignments(faculty_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
```

**Fields:**
- `id` - Primary key
- `title` - Assignment title
- `subject_id` - References subjects.id
- `faculty_id` - References faculty.id (creator)
- `instructions` - Assignment instructions
- `total_marks` - Maximum marks
- `due_date` - Submission deadline
- `allow_late_submission` - Whether late submissions are allowed
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 9. `assignment_resources`
Stores resource files attached to assignments.

```sql
CREATE TABLE assignment_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignment_resources_assignment ON assignment_resources(assignment_id);
```

**Fields:**
- `id` - Primary key
- `assignment_id` - References assignments.id
- `file_name` - Original file name
- `file_url` - Storage URL/path
- `file_size` - File size in bytes
- `file_type` - MIME type
- `uploaded_at` - Upload timestamp

---

### 10. `submissions`
Stores student assignment submissions.

```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'pending')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_late BOOLEAN DEFAULT false,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
```

**Fields:**
- `id` - Primary key
- `assignment_id` - References assignments.id
- `student_id` - References students.id
- `status` - Submission status: `submitted`, `late`, `pending`
- `submitted_at` - Submission timestamp
- `is_late` - Whether submission was late
- `comment` - Optional student comment
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- Unique constraint on (assignment_id, student_id) - one submission per assignment per student

---

### 11. `submission_files`
Stores files uploaded with submissions.

```sql
CREATE TABLE submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submission_files_submission ON submission_files(submission_id);
```

**Fields:**
- `id` - Primary key
- `submission_id` - References submissions.id
- `file_name` - Original file name
- `file_url` - Storage URL/path
- `file_size` - File size in bytes
- `file_type` - MIME type
- `uploaded_at` - Upload timestamp

---

### 12. `grades`
Stores grading information for submissions.

```sql
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  marks INTEGER NOT NULL CHECK (marks >= 0),
  grade VARCHAR(10),
  feedback TEXT,
  graded_by UUID NOT NULL REFERENCES faculty(id),
  graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_released BOOLEAN DEFAULT false,
  released_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id)
);

CREATE INDEX idx_grades_submission ON grades(submission_id);
CREATE INDEX idx_grades_graded_by ON grades(graded_by);
CREATE INDEX idx_grades_is_released ON grades(is_released);
```

**Fields:**
- `id` - Primary key
- `submission_id` - References submissions.id (one grade per submission)
- `marks` - Marks awarded
- `grade` - Letter grade (e.g., "A+", "A", "B")
- `feedback` - Faculty feedback
- `graded_by` - References faculty.id
- `graded_at` - Grading timestamp
- `is_released` - Whether grade is visible to student
- `released_at` - When grade was released
- `updated_at` - Last update timestamp
- Unique constraint on submission_id

---

## Notes Tables

### 13. `notes`
Stores both official (faculty) and unofficial (student) notes.

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  chapter VARCHAR(100),
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploader_role VARCHAR(20) NOT NULL CHECK (uploader_role IN ('faculty', 'student')),
  note_type VARCHAR(20) NOT NULL CHECK (note_type IN ('official', 'unofficial')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES faculty(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_subject ON notes(subject_id);
CREATE INDEX idx_notes_uploaded_by ON notes(uploaded_by);
CREATE INDEX idx_notes_type ON notes(note_type);
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_verified_by ON notes(verified_by);
```

**Fields:**
- `id` - Primary key
- `title` - Note title
- `chapter` - Chapter/Unit name
- `subject_id` - References subjects.id (optional for unofficial notes)
- `uploaded_by` - References users.id (faculty or student)
- `uploader_role` - Role of uploader: `faculty` or `student`
- `note_type` - Type: `official` (faculty) or `unofficial` (student)
- `status` - Status: `pending`, `verified`, `rejected` (only for unofficial)
- `verified_by` - References faculty.id (who verified)
- `verified_at` - Verification timestamp
- `rejection_reason` - Reason for rejection (if rejected)
- `uploaded_at` - Upload timestamp
- `updated_at` - Last update timestamp

---

### 14. `note_files`
Stores note file information.

```sql
CREATE TABLE note_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_note_files_note ON note_files(note_id);
```

**Fields:**
- `id` - Primary key
- `note_id` - References notes.id
- `file_name` - Original file name
- `file_url` - Storage URL/path
- `file_size` - File size in bytes
- `file_type` - MIME type
- `uploaded_at` - Upload timestamp

---

## Textbook Tables

### 15. `textbooks`
Stores textbook information.

```sql
CREATE TABLE textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  edition VARCHAR(50),
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_textbooks_subject ON textbooks(subject_id);
CREATE INDEX idx_textbooks_uploaded_by ON textbooks(uploaded_by);
```

**Fields:**
- `id` - Primary key
- `title` - Textbook title
- `author` - Author name(s)
- `edition` - Edition number
- `subject_id` - References subjects.id (optional)
- `uploaded_by` - References faculty.id
- `uploaded_at` - Upload timestamp
- `updated_at` - Last update timestamp

---

### 16. `textbook_files`
Stores textbook file information.

```sql
CREATE TABLE textbook_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES textbooks(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_textbook_files_textbook ON textbook_files(textbook_id);
```

**Fields:**
- `id` - Primary key
- `textbook_id` - References textbooks.id
- `file_name` - Original file name
- `file_url` - Storage URL/path
- `file_size` - File size in bytes
- `file_type` - MIME type
- `uploaded_at` - Upload timestamp

---

## Activity & Audit Tables

### 17. `activities`
Stores system activities for admin dashboard.

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
```

**Fields:**
- `id` - Primary key
- `type` - Activity type: `student_registered`, `notes_verified`, `resource_uploaded`, `system_backup`, etc.
- `description` - Activity description
- `user_id` - References users.id (who performed the action)
- `metadata` - Additional JSON data
- `created_at` - Activity timestamp

**Activity Types:**
- `student_registered`
- `faculty_registered`
- `notes_verified`
- `notes_rejected`
- `resource_uploaded`
- `assignment_created`
- `assignment_submitted`
- `grades_released`
- `system_backup`
- `system_settings_updated`

---

## Views (Optional but Recommended)

### View: `student_dashboard_view`
Aggregates student dashboard data.

```sql
CREATE VIEW student_dashboard_view AS
SELECT 
  s.id AS student_id,
  s.full_name,
  s.usn,
  s.programme,
  s.semester,
  COUNT(DISTINCT ss.subject_id) AS enrolled_subjects_count,
  COUNT(DISTINCT a.id) AS total_assignments,
  COUNT(DISTINCT CASE WHEN sub.id IS NOT NULL THEN a.id END) AS submitted_assignments,
  COUNT(DISTINCT CASE WHEN g.id IS NOT NULL THEN a.id END) AS graded_assignments
FROM students s
LEFT JOIN student_subjects ss ON s.id = ss.student_id AND ss.status = 'active'
LEFT JOIN subjects subj ON ss.subject_id = subj.id
LEFT JOIN assignments a ON subj.id = a.subject_id
LEFT JOIN submissions sub ON a.id = sub.assignment_id AND sub.student_id = s.id
LEFT JOIN grades g ON sub.id = g.submission_id AND g.is_released = true
GROUP BY s.id, s.full_name, s.usn, s.programme, s.semester;
```

---

### View: `faculty_dashboard_view`
Aggregates faculty dashboard data.

```sql
CREATE VIEW faculty_dashboard_view AS
SELECT 
  f.id AS faculty_id,
  f.name,
  f.department,
  COUNT(DISTINCT fs.subject_id) AS assigned_subjects_count,
  COUNT(DISTINCT a.id) AS created_assignments_count,
  COUNT(DISTINCT CASE WHEN n.status = 'pending' THEN n.id END) AS pending_verifications_count
FROM faculty f
LEFT JOIN faculty_subjects fs ON f.id = fs.faculty_id
LEFT JOIN assignments a ON f.id = a.faculty_id
LEFT JOIN notes n ON n.verified_by = f.id OR (n.uploader_role = 'student' AND n.status = 'pending')
GROUP BY f.id, f.name, f.department;
```

---

## Database Constraints & Rules

### Foreign Key Constraints
- All foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- `ON DELETE CASCADE`: When parent is deleted, child records are deleted
- `ON DELETE SET NULL`: When parent is deleted, foreign key is set to NULL

### Check Constraints
- Status fields use CHECK constraints to ensure valid values
- Marks fields use CHECK constraints to ensure non-negative values

### Unique Constraints
- `students.usn` - Unique Student Number
- `subjects.code` - Unique Subject Code
- `faculty_subjects(faculty_id, subject_id)` - One assignment per faculty-subject pair
- `student_subjects(student_id, subject_id)` - One enrollment per student-subject pair
- `submissions(assignment_id, student_id)` - One submission per assignment per student
- `grades(submission_id)` - One grade per submission

---

## Indexes

All foreign keys and frequently queried fields have indexes for performance:
- Foreign key columns
- Status fields
- Date fields used in filtering
- Search fields (usn, email, name)

---

## Sample Data Seeds

### Insert Sample Subjects
```sql
INSERT INTO subjects (code, name, programme, semester) VALUES
('CS501', 'Operating Systems', 'B.Tech CSE', 'Sem V'),
('CS502', 'Database Management', 'B.Tech CSE', 'Sem V'),
('CS-401', 'Advanced Algorithms', 'B.Tech CSE', 'Sem IV'),
('CS-405', 'Machine Learning Fundamentals', 'B.Tech CSE', 'Sem IV');
```

---

## Migration Strategy

1. **Phase 1**: Create core tables (users, students, faculty, admins, subjects)
2. **Phase 2**: Create relationship tables (faculty_subjects, student_subjects)
3. **Phase 3**: Create assignment tables (assignments, submissions, grades)
4. **Phase 4**: Create content tables (notes, textbooks)
5. **Phase 5**: Create activity/audit tables
6. **Phase 6**: Create views and indexes
7. **Phase 7**: Seed initial data

---

## Notes for Implementation

1. **UUID vs Integer**: Using UUID for all primary keys provides better scalability and avoids ID conflicts
2. **Timestamps**: All tables include `created_at` and `updated_at` for audit trails
3. **Soft Deletes**: Consider adding `deleted_at` timestamp for soft delete functionality
4. **File Storage**: File URLs should point to cloud storage (S3, Google Cloud Storage, Supabase Storage)
5. **Full-Text Search**: Consider adding full-text search indexes on text fields (title, description, instructions)
6. **Partitioning**: For large tables (submissions, notes), consider partitioning by date
7. **Backup**: Implement regular database backups
8. **Connection Pooling**: Use connection pooling for production
9. **Read Replicas**: Consider read replicas for read-heavy operations

---

## ER Diagram Summary

```
users (1) ──< (1) students
users (1) ──< (1) faculty
users (1) ──< (1) admins

subjects (1) ──< (*) faculty_subjects (*) ──< (1) faculty
subjects (1) ──< (*) student_subjects (*) ──< (1) students

subjects (1) ──< (*) assignments (1) ──< (1) faculty
assignments (1) ──< (*) submissions (1) ──< (1) students
submissions (1) ──< (1) grades (1) ──< (1) faculty

subjects (1) ──< (*) notes
subjects (1) ──< (*) textbooks
```

---

## Database Size Estimates

Assuming:
- 10,000 students
- 500 faculty
- 300 subjects
- 1,000 assignments/year
- 50,000 submissions/year
- 5,000 notes
- 500 textbooks

**Estimated Storage:**
- Tables: ~500MB
- Indexes: ~200MB
- Files (stored separately): ~100GB
- **Total Database**: ~1GB (excluding file storage)
