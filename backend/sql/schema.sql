-- Kairos backend schema (Supabase/PostgreSQL)
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists students (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(255) not null,
  usn varchar(50) unique not null,
  programme varchar(255) not null,
  semester smallint not null check (semester between 1 and 8),
  status varchar(20) default 'active' check (status in ('active', 'disabled')),
  registered_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists faculty (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar(255) not null,
  department varchar(255) not null,
  designation varchar(100),
  status varchar(20) default 'active' check (status in ('active', 'disabled')),
  join_date timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar(255) not null,
  role varchar(50) default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) unique not null,
  name varchar(255) not null,
  programme varchar(255) not null,
  semester smallint not null check (semester between 1 and 8),
  description text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists faculty_subjects (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references faculty(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  assigned_at timestamp default current_timestamp,
  unique (faculty_id, subject_id)
);

create table if not exists student_subjects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  enrolled_at timestamp default current_timestamp,
  status varchar(20) default 'active' check (status in ('active', 'dropped')),
  unique (student_id, subject_id)
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  subject_id uuid not null references subjects(id) on delete cascade,
  faculty_id uuid not null references faculty(id) on delete cascade,
  instructions text not null,
  total_marks integer not null check (total_marks > 0),
  due_date timestamp not null,
  allow_late_submission boolean default false,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists assignment_resources (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  file_name varchar(255) not null,
  file_url text not null,
  file_size bigint not null,
  file_type varchar(50),
  uploaded_at timestamp default current_timestamp
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status varchar(20) default 'submitted' check (status in ('submitted', 'late', 'pending')),
  submitted_at timestamp default current_timestamp,
  is_late boolean default false,
  comment text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  unique (assignment_id, student_id)
);

create table if not exists submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  file_name varchar(255) not null,
  file_url text not null,
  file_size bigint not null,
  file_type varchar(50),
  uploaded_at timestamp default current_timestamp
);

create table if not exists grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  marks integer not null check (marks >= 0),
  grade varchar(10),
  feedback text,
  graded_by uuid not null references faculty(id),
  graded_at timestamp default current_timestamp,
  is_released boolean default false,
  released_at timestamp,
  updated_at timestamp default current_timestamp,
  unique (submission_id)
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  chapter varchar(100),
  subject_id uuid references subjects(id) on delete set null,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  uploader_role varchar(20) not null check (uploader_role in ('faculty', 'student')),
  note_type varchar(20) not null check (note_type in ('official', 'unofficial')),
  status varchar(20) default 'pending' check (status in ('pending', 'verified', 'rejected')),
  verified_by uuid references faculty(id),
  verified_at timestamp,
  rejection_reason text,
  uploaded_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists note_files (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  file_name varchar(255) not null,
  file_url text not null,
  file_size bigint not null,
  file_type varchar(50),
  uploaded_at timestamp default current_timestamp
);

create table if not exists textbooks (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  author varchar(255) not null,
  edition varchar(50),
  subject_id uuid references subjects(id) on delete set null,
  uploaded_by uuid not null references faculty(id) on delete cascade,
  uploaded_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists textbook_files (
  id uuid primary key default gen_random_uuid(),
  textbook_id uuid not null references textbooks(id) on delete cascade,
  file_name varchar(255) not null,
  file_url text not null,
  file_size bigint not null,
  file_type varchar(50),
  uploaded_at timestamp default current_timestamp
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  type varchar(50) not null,
  description text not null,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb,
  created_at timestamp default current_timestamp
);

create index if not exists idx_students_usn on students(usn);
create index if not exists idx_students_programme on students(programme);
create index if not exists idx_students_semester on students(semester);
create index if not exists idx_students_status on students(status);
create index if not exists idx_faculty_department on faculty(department);
create index if not exists idx_faculty_status on faculty(status);
create index if not exists idx_subjects_code on subjects(code);
create index if not exists idx_subjects_programme on subjects(programme);
create index if not exists idx_subjects_semester on subjects(semester);
create index if not exists idx_faculty_subjects_faculty on faculty_subjects(faculty_id);
create index if not exists idx_faculty_subjects_subject on faculty_subjects(subject_id);
create index if not exists idx_student_subjects_student on student_subjects(student_id);
create index if not exists idx_student_subjects_subject on student_subjects(subject_id);
create index if not exists idx_student_subjects_status on student_subjects(status);
create index if not exists idx_assignments_subject on assignments(subject_id);
create index if not exists idx_assignments_faculty on assignments(faculty_id);
create index if not exists idx_assignments_due_date on assignments(due_date);
create index if not exists idx_submissions_assignment on submissions(assignment_id);
create index if not exists idx_submissions_student on submissions(student_id);
create index if not exists idx_submissions_status on submissions(status);
create index if not exists idx_grades_submission on grades(submission_id);
create index if not exists idx_grades_graded_by on grades(graded_by);
create index if not exists idx_notes_subject on notes(subject_id);
create index if not exists idx_notes_uploaded_by on notes(uploaded_by);
create index if not exists idx_notes_type on notes(note_type);
create index if not exists idx_notes_status on notes(status);
create index if not exists idx_activities_type on activities(type);

insert into subjects (code, name, programme, semester)
values
  -- BCA (Honours) core computer-based subjects (Sem 1 to Sem 6)
  -- Source: syllabus pages 10-13 (Version 2022.03)

  -- Semester 1
  ('22BCA101', 'Fundamentals of Computer', 'BCA (Honours)', 1),
  ('22BCA102', 'Lab: Fundamentals of Computer', 'BCA (Honours)', 1),
  ('22BCA103', 'Programming in C', 'BCA (Honours)', 1),
  ('22BCA104', 'Lab: Programming in C', 'BCA (Honours)', 1),

  -- Semester 2
  ('22BCA201', 'Data Structure Using C', 'BCA (Honours)', 2),
  ('22BCA202', 'Lab: Data Structure Using C', 'BCA (Honours)', 2),
  ('22BCA203', 'Object Oriented Concepts using JAVA', 'BCA (Honours)', 2),
  ('22BCA204', 'Lab: Object Oriented Concepts using JAVA', 'BCA (Honours)', 2),

  -- Semester 3
  ('22BCA301', 'Database Management System', 'BCA (Honours)', 3),
  ('22BCA302', 'Lab: Database Management System', 'BCA (Honours)', 3),
  ('22BCA303', 'VB.NET Programming', 'BCA (Honours)', 3),
  ('22BCA304', 'Lab: VB.NET Programming', 'BCA (Honours)', 3),
  ('22BCA305', 'Operating System Concept', 'BCA (Honours)', 3),

  -- Semester 4
  ('22BCA401', 'Python Programming', 'BCA (Honours)', 4),
  ('22BCA402', 'Lab: Python Programming', 'BCA (Honours)', 4),
  ('22BCA403', 'Web Application Development', 'BCA (Honours)', 4),
  ('22BCA404', 'Lab: JavaScript, HTML&CSS', 'BCA (Honours)', 4),
  ('22BCA405', 'Computer Communication & Network', 'BCA (Honours)', 4),
  ('22BCA406', 'Software Engineering', 'BCA (Honours)', 4),

  -- Semester 5
  ('22BCA501', 'Computer Graphics & Animation', 'BCA (Honours)', 5),
  ('22BCA502', 'Lab: Computer Graphics & Animation', 'BCA (Honours)', 5),
  ('22BCA503', 'Analysis and Design of Algorithms', 'BCA (Honours)', 5),
  ('22BCA504', 'Lab: Analysis and Design of Algorithms', 'BCA (Honours)', 5),
  ('22BCA505', 'Mini Project', 'BCA (Honours)', 5),

  -- Semester 6
  ('22BCA601', 'Artificial Intelligence', 'BCA (Honours)', 6),
  ('22BCA602', 'PHP & MySQL', 'BCA (Honours)', 6),
  ('22BCA603', 'Internship', 'BCA (Honours)', 6)
on conflict (code) do nothing;
