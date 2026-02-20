# API Endpoints Documentation

This document outlines all API endpoints required for the Kairos Academic Repository system. The backend will be implemented using Node.js with Express.

## Base URL
```
http://localhost:4000/api
```

## Authentication
Most endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Endpoints

### POST `/api/auth/student/register`
Register a new student account.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "usn": "1RV21CS001",
  "programme": "Computer Science & Engineering",
  "semester": "6",
  "email": "john.doe@univ.edu.in",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "Student registration successful.",
  "user": {
    "id": "uuid",
    "email": "john.doe@univ.edu.in",
    "role": "student"
  },
  "session": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresAt": 1234567890
  }
}
```

**Errors:**
- `400` - Validation error or email already exists
- `500` - Server error

---

### POST `/api/auth/student/login`
Student login.

**Request Body:**
```json
{
  "email": "john.doe@univ.edu.in",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "STUDENT login successful.",
  "user": {
    "id": "uuid",
    "email": "john.doe@univ.edu.in",
    "role": "student"
  },
  "session": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresAt": 1234567890
  }
}
```

**Errors:**
- `400` - Invalid credentials format
- `401` - Invalid login credentials
- `403` - Account does not have STUDENT access

---

### POST `/api/auth/faculty/login`
Faculty login.

**Request Body:**
```json
{
  "email": "faculty@univ.edu.in",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "FACULTY login successful.",
  "user": {
    "id": "uuid",
    "email": "faculty@univ.edu.in",
    "role": "faculty"
  },
  "session": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresAt": 1234567890
  }
}
```

---

### POST `/api/auth/admin/login`
Admin login.

**Request Body:**
```json
{
  "email": "admin@univ.edu.in",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "ADMIN login successful.",
  "user": {
    "id": "uuid",
    "email": "admin@univ.edu.in",
    "role": "admin"
  },
  "session": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresAt": 1234567890
  }
}
```

---

### POST `/api/auth/logout`
Logout current user (invalidate token).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logout successful."
}
```

---

### POST `/api/auth/refresh`
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response (200):**
```json
{
  "accessToken": "new_jwt_token",
  "expiresAt": 1234567890
}
```

---

### GET `/api/auth/me`
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@univ.edu.in",
    "role": "student",
    "fullName": "John Doe",
    "usn": "1RV21CS001",
    "programme": "Computer Science & Engineering",
    "semester": "6"
  }
}
```

---

### POST `/api/auth/forgot-password`
Request password reset email.

**Request Body:**
```json
{
  "email": "user@univ.edu.in"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent."
}
```

---

### POST `/api/auth/reset-password`
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful."
}
```

---

## 👥 Student Endpoints

### GET `/api/students/dashboard`
Get student dashboard data.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "student": {
    "id": "uuid",
    "fullName": "John Doe",
    "usn": "1RV21CS001",
    "programme": "Computer Science & Engineering",
    "semester": "6",
    "email": "john.doe@univ.edu.in"
  },
  "enrolledSubjects": [
    {
      "id": "uuid",
      "code": "CS501",
      "name": "Operating Systems",
      "faculty": {
        "id": "uuid",
        "name": "Dr. Robert Wilson"
      }
    }
  ],
  "assignments": [
    {
      "id": "uuid",
      "title": "Memory Mapping Lab",
      "subjectCode": "CS501",
      "dueDate": "2023-11-12T23:59:59Z",
      "status": "pending",
      "submittedAt": null,
      "grade": null
    }
  ],
  "recentNotes": [
    {
      "id": "uuid",
      "title": "Memory Management Overview",
      "chapter": "Chapter 4",
      "facultyName": "Dr. Robert Wilson",
      "uploadedAt": "2023-10-12T10:00:00Z",
      "downloadUrl": "/api/notes/uuid/download"
    }
  ],
  "textbooks": [
    {
      "id": "uuid",
      "title": "Operating System Concepts",
      "author": "Silberschatz, Galvin, Gagne",
      "edition": "10th Edition",
      "downloadUrl": "/api/textbooks/uuid/download"
    }
  ]
}
```

---

### GET `/api/students/assignments`
Get all assignments for student (with filters).

**Query Parameters:**
- `subjectId` (optional) - Filter by subject
- `status` (optional) - Filter by status: `pending`, `submitted`, `graded`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Response (200):**
```json
{
  "assignments": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### GET `/api/assignments/:id`
Get assignment details.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "SQL Joins",
  "subjectId": "uuid",
  "subjectCode": "CS501",
  "instructions": "Write queries for Inner, Left, Right...",
  "totalMarks": 50,
  "dueDate": "2023-11-24T23:59:59Z",
  "allowLateSubmission": true,
  "resources": [
    {
      "id": "uuid",
      "fileName": "Database_Schema.pdf",
      "fileUrl": "/api/assignments/uuid/resources/uuid/download"
    }
  ],
  "submission": {
    "id": "uuid",
    "status": "submitted",
    "submittedAt": "2023-11-24T22:30:00Z",
    "files": [...],
    "grade": null
  }
}
```

---

### POST `/api/assignments/:id/submit`
Submit assignment.

**Request Body (multipart/form-data):**
```
files: File[]
comment: string (optional)
```

**Response (201):**
```json
{
  "message": "Assignment submitted successfully.",
  "submission": {
    "id": "uuid",
    "status": "submitted",
    "submittedAt": "2023-11-24T22:30:00Z"
  }
}
```

**Errors:**
- `400` - No files provided or past deadline
- `404` - Assignment not found

---

### GET `/api/assignments/:id/submission`
Get student's submission for an assignment.

**Response (200):**
```json
{
  "id": "uuid",
  "assignmentId": "uuid",
  "status": "submitted",
  "submittedAt": "2023-11-24T22:30:00Z",
  "files": [
    {
      "id": "uuid",
      "fileName": "solution.sql",
      "fileSize": 1024000,
      "uploadedAt": "2023-11-24T22:30:00Z"
    }
  ],
  "comment": "Optional comment",
  "grade": {
    "marks": 45,
    "grade": "A",
    "feedback": "Excellent work!",
    "gradedAt": "2023-11-25T10:00:00Z"
  }
}
```

---

### PUT `/api/assignments/:id/submission`
Update submission (only before deadline).

**Request Body (multipart/form-data):**
```
files: File[] (optional)
comment: string (optional)
```

**Response (200):**
```json
{
  "message": "Submission updated successfully.",
  "submission": {...}
}
```

---

### GET `/api/students/notes/unofficial`
Get unofficial notes uploaded by students.

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `verified`, `rejected`
- `page` (optional)
- `limit` (optional)

**Response (200):**
```json
{
  "notes": [
    {
      "id": "uuid",
      "title": "OS - Deadlocks Short Notes",
      "uploadedOn": "2023-10-24T10:00:00Z",
      "fileInfo": "PDF • 1.2 MB",
      "status": "verified",
      "downloadUrl": "/api/notes/uuid/download"
    }
  ],
  "pagination": {...}
}
```

---

### POST `/api/students/notes/unofficial`
Upload unofficial note.

**Request Body (multipart/form-data):**
```
file: File
title: string
chapter: string (optional)
```

**Response (201):**
```json
{
  "message": "Note uploaded successfully.",
  "note": {
    "id": "uuid",
    "title": "OS - Deadlocks Short Notes",
    "status": "pending",
    "uploadedOn": "2023-10-24T10:00:00Z"
  }
}
```

---

## 👨‍🏫 Faculty Endpoints

### GET `/api/faculty/dashboard`
Get faculty dashboard data.

**Response (200):**
```json
{
  "faculty": {
    "id": "uuid",
    "name": "Dr. Sarah Jenkins",
    "email": "sarah.jenkins@univ.edu.in",
    "department": "Computer Science"
  },
  "assignedSubjects": [
    {
      "id": "uuid",
      "code": "CS501",
      "name": "Operating Systems",
      "enrolledStudents": 60
    }
  ],
  "pendingVerifications": 5,
  "recentAssignments": [...],
  "officialNotes": [...]
}
```

---

### GET `/api/faculty/subjects`
Get all subjects assigned to faculty.

**Response (200):**
```json
{
  "subjects": [
    {
      "id": "uuid",
      "code": "CS501",
      "name": "Operating Systems",
      "programme": "B.Tech CSE",
      "semester": "Sem V",
      "enrolledStudents": 60
    }
  ]
}
```

---

### POST `/api/assignments`
Create new assignment.

**Request Body:**
```json
{
  "title": "Memory Mapping Lab",
  "subjectId": "uuid",
  "instructions": "Implement memory mapping...",
  "totalMarks": 50,
  "dueDate": "2023-11-24T23:59:59Z",
  "allowLateSubmission": true,
  "resources": [] // File IDs or URLs
}
```

**Response (201):**
```json
{
  "message": "Assignment created successfully.",
  "assignment": {
    "id": "uuid",
    "title": "Memory Mapping Lab",
    "createdAt": "2023-11-01T10:00:00Z"
  }
}
```

---

### GET `/api/assignments/:id/submissions`
Get all submissions for an assignment.

**Query Parameters:**
- `status` (optional) - Filter by status: `submitted`, `late`, `pending`
- `page` (optional)
- `limit` (optional)

**Response (200):**
```json
{
  "assignment": {
    "id": "uuid",
    "title": "Memory Mapping Lab",
    "totalStudents": 60,
    "submittedCount": 45,
    "pendingCount": 10,
    "lateCount": 5
  },
  "submissions": [
    {
      "id": "uuid",
      "student": {
        "id": "uuid",
        "name": "Aditi Mishra",
        "usn": "1RV21CS001"
      },
      "submittedAt": "2023-11-12T10:45:00Z",
      "status": "submitted",
      "isLate": false,
      "grade": null
    }
  ],
  "pagination": {...}
}
```

---

### GET `/api/submissions/:id`
Get submission details.

**Response (200):**
```json
{
  "id": "uuid",
  "assignment": {
    "id": "uuid",
    "title": "Memory Mapping Lab",
    "totalMarks": 50,
    "dueDate": "2023-11-12T23:59:59Z"
  },
  "student": {
    "id": "uuid",
    "name": "Aditi Mishra",
    "usn": "1RV21CS001"
  },
  "submittedAt": "2023-11-12T10:45:00Z",
  "isLate": false,
  "files": [...],
  "comment": "Optional comment",
  "grade": null
}
```

---

### POST `/api/submissions/:id/grade`
Grade a submission.

**Request Body:**
```json
{
  "marks": 45,
  "grade": "A",
  "feedback": "Excellent work on the memory mapping simulation..."
}
```

**Response (200):**
```json
{
  "message": "Submission graded successfully.",
  "grade": {
    "id": "uuid",
    "marks": 45,
    "grade": "A",
    "feedback": "...",
    "gradedAt": "2023-11-25T10:00:00Z"
  }
}
```

---

### PUT `/api/submissions/:id/grade`
Update grade.

**Request Body:**
```json
{
  "marks": 48,
  "grade": "A+",
  "feedback": "Updated feedback..."
}
```

**Response (200):**
```json
{
  "message": "Grade updated successfully.",
  "grade": {...}
}
```

---

### POST `/api/assignments/:id/release-grades`
Release grades to all students (make visible).

**Response (200):**
```json
{
  "message": "Grades released successfully.",
  "releasedAt": "2023-11-25T10:00:00Z"
}
```

---

### GET `/api/faculty/notes/official`
Get official notes uploaded by faculty.

**Response (200):**
```json
{
  "notes": [
    {
      "id": "uuid",
      "title": "Virtual Memory Architecture",
      "chapter": "Unit 4",
      "subjectId": "uuid",
      "uploadedAt": "2023-10-12T10:00:00Z",
      "downloadUrl": "/api/notes/uuid/download"
    }
  ]
}
```

---

### POST `/api/faculty/notes/official`
Upload official note.

**Request Body (multipart/form-data):**
```
file: File
title: string
chapter: string
subjectId: string
```

**Response (201):**
```json
{
  "message": "Note uploaded successfully.",
  "note": {
    "id": "uuid",
    "title": "Virtual Memory Architecture",
    "uploadedAt": "2023-10-12T10:00:00Z"
  }
}
```

---

### GET `/api/faculty/notes/verification`
Get pending student notes for verification.

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `verified`, `rejected`
- `chapter` (optional) - Filter by chapter
- `page` (optional)
- `limit` (optional)

**Response (200):**
```json
{
  "notes": [
    {
      "id": "uuid",
      "title": "Virtual Memory Deep Dive",
      "student": {
        "id": "uuid",
        "name": "Aditya Kulkarni",
        "usn": "1MS21CS004"
      },
      "chapter": "Unit 3",
      "uploadedAt": "2023-10-24T10:00:00Z",
      "status": "pending",
      "downloadUrl": "/api/notes/uuid/download"
    }
  ],
  "pagination": {...}
}
```

---

### POST `/api/notes/:id/verify`
Verify student note.

**Request Body:**
```json
{
  "action": "approve" // or "reject"
}
```

**Response (200):**
```json
{
  "message": "Note verified successfully.",
  "note": {
    "id": "uuid",
    "status": "verified"
  }
}
```

---

### POST `/api/notes/:id/reject`
Reject student note.

**Request Body:**
```json
{
  "reason": "Incomplete content" // optional
}
```

**Response (200):**
```json
{
  "message": "Note rejected.",
  "note": {
    "id": "uuid",
    "status": "rejected"
  }
}
```

---

### GET `/api/textbooks`
Get textbooks (for faculty's subjects).

**Query Parameters:**
- `subjectId` (optional) - Filter by subject

**Response (200):**
```json
{
  "textbooks": [
    {
      "id": "uuid",
      "title": "Operating System Concepts",
      "author": "Silberschatz, Galvin, Gagne",
      "edition": "10th Edition",
      "subjectId": "uuid",
      "uploadedAt": "2023-10-15T10:00:00Z",
      "downloadUrl": "/api/textbooks/uuid/download"
    }
  ]
}
```

---

### POST `/api/textbooks`
Upload textbook.

**Request Body (multipart/form-data):**
```
file: File
title: string
author: string
edition: string
subjectId: string
```

**Response (201):**
```json
{
  "message": "Textbook uploaded successfully.",
  "textbook": {
    "id": "uuid",
    "title": "Operating System Concepts",
    "uploadedAt": "2023-10-15T10:00:00Z"
  }
}
```

---

## 👨‍💼 Admin Endpoints

### GET `/api/admin/dashboard`
Get admin dashboard data.

**Response (200):**
```json
{
  "stats": {
    "totalStudents": 12482,
    "totalFaculty": 845,
    "totalSubjects": 312,
    "pendingVerifications": 58
  },
  "recentActivities": [
    {
      "id": "uuid",
      "type": "student_registered",
      "description": "David Smith (ID: ST2024001) has completed the portal registration.",
      "timestamp": "2023-11-20T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/admin/students`
Get all students (with filters).

**Query Parameters:**
- `search` (optional) - Search by name or USN
- `programme` (optional) - Filter by programme
- `semester` (optional) - Filter by semester
- `status` (optional) - Filter by status: `active`, `disabled`
- `page` (optional)
- `limit` (optional)

**Response (200):**
```json
{
  "students": [
    {
      "id": "uuid",
      "fullName": "Aditi Sharma",
      "usn": "1RV21CS001",
      "programme": "Computer Science & Engineering",
      "semester": "6",
      "email": "aditi.s@univ.edu.in",
      "status": "active",
      "registeredAt": "2023-10-15T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### GET `/api/admin/students/:id`
Get student details.

**Response (200):**
```json
{
  "id": "uuid",
  "fullName": "Aditi Sharma",
  "usn": "1RV21CS001",
  "email": "aditi.s@univ.edu.in",
  "programme": "Computer Science & Engineering",
  "semester": "6",
  "status": "active",
  "registeredAt": "2023-10-15T10:00:00Z",
  "enrolledSubjects": [
    {
      "id": "uuid",
      "code": "CS501",
      "name": "Operating Systems",
      "faculty": {
        "id": "uuid",
        "name": "Dr. Robert Wilson"
      }
    }
  ],
  "assignmentSubmissions": [
    {
      "id": "uuid",
      "assignmentTitle": "Memory Mapping Lab",
      "subjectCode": "CS501",
      "status": "submitted",
      "grade": "A+"
    }
  ]
}
```

---

### POST `/api/admin/students`
Create student account (admin).

**Request Body:**
```json
{
  "fullName": "John Doe",
  "usn": "1RV21CS002",
  "programme": "Computer Science & Engineering",
  "semester": "6",
  "email": "john.doe@univ.edu.in",
  "password": "temporary_password"
}
```

**Response (201):**
```json
{
  "message": "Student account created successfully.",
  "student": {
    "id": "uuid",
    "email": "john.doe@univ.edu.in"
  }
}
```

---

### PUT `/api/admin/students/:id`
Update student.

**Request Body:**
```json
{
  "fullName": "John Doe Updated",
  "programme": "Information Science",
  "semester": "7"
}
```

**Response (200):**
```json
{
  "message": "Student updated successfully.",
  "student": {...}
}
```

---

### POST `/api/admin/students/:id/disable`
Disable student account.

**Response (200):**
```json
{
  "message": "Student account disabled.",
  "student": {
    "id": "uuid",
    "status": "disabled"
  }
}
```

---

### POST `/api/admin/students/:id/enable`
Enable student account.

**Response (200):**
```json
{
  "message": "Student account enabled.",
  "student": {
    "id": "uuid",
    "status": "active"
  }
}
```

---

### POST `/api/admin/students/:id/reset-password`
Reset student password (admin).

**Request Body:**
```json
{
  "newPassword": "new_password_123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully."
}
```

---

### GET `/api/admin/faculty`
Get all faculty (with filters).

**Query Parameters:**
- `search` (optional) - Search by name or email
- `department` (optional) - Filter by department
- `status` (optional) - Filter by status: `active`, `disabled`
- `page` (optional)
- `limit` (optional)

**Response (200):**
```json
{
  "faculty": [
    {
      "id": "uuid",
      "name": "Dr. David Anderson",
      "email": "d.anderson@university.edu",
      "department": "Computer Science",
      "designation": "Senior Professor",
      "assignedSubjectsCount": 4,
      "status": "active",
      "joinDate": "2020-01-15T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### GET `/api/admin/faculty/:id`
Get faculty details.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Dr. David Anderson",
  "email": "d.anderson@university.edu",
  "department": "Computer Science",
  "designation": "Senior Professor",
  "status": "active",
  "joinDate": "2020-01-15T10:00:00Z",
  "assignedSubjects": [
    {
      "id": "uuid",
      "code": "CS-401",
      "name": "Advanced Algorithms",
      "programme": "B.Tech CSE",
      "enrolledStudents": 45
    }
  ],
  "createdAssignments": [
    {
      "id": "uuid",
      "title": "Memory Mapping Lab",
      "subjectCode": "CS-401",
      "dueDate": "2023-11-12T23:59:59Z",
      "submissionsCount": 45
    }
  ]
}
```

---

### POST `/api/admin/faculty`
Create faculty account.

**Request Body:**
```json
{
  "name": "Dr. New Faculty",
  "email": "new.faculty@university.edu",
  "department": "Computer Science",
  "designation": "Assistant Professor",
  "password": "temporary_password"
}
```

**Response (201):**
```json
{
  "message": "Faculty account created successfully.",
  "faculty": {
    "id": "uuid",
    "email": "new.faculty@university.edu"
  },
  "temporaryPassword": "UNIV-XXXX-XXXX"
}
```

---

### PUT `/api/admin/faculty/:id`
Update faculty.

**Request Body:**
```json
{
  "name": "Dr. Updated Name",
  "department": "Mathematics",
  "designation": "Associate Professor"
}
```

**Response (200):**
```json
{
  "message": "Faculty updated successfully.",
  "faculty": {...}
}
```

---

### POST `/api/admin/faculty/:id/disable`
Disable faculty account.

**Response (200):**
```json
{
  "message": "Faculty account disabled.",
  "faculty": {
    "id": "uuid",
    "status": "disabled"
  }
}
```

---

### GET `/api/subjects`
Get all subjects.

**Query Parameters:**
- `programme` (optional) - Filter by programme
- `semester` (optional) - Filter by semester
- `page` (optional)
- `limit` (optional)

**Response (200):**
```json
{
  "subjects": [
    {
      "id": "uuid",
      "code": "CS-401",
      "name": "Advanced Algorithms",
      "programme": "B.Tech CSE",
      "semester": "Sem IV",
      "faculty": {
        "id": "uuid",
        "name": "Dr. Robert Henderson"
      },
      "enrolledStudents": 45
    }
  ],
  "pagination": {...}
}
```

---

### POST `/api/faculty/:facultyId/subjects`
Assign subjects to faculty.

**Request Body:**
```json
{
  "subjectIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (200):**
```json
{
  "message": "Subjects assigned successfully.",
  "assignedSubjects": [
    {
      "id": "uuid1",
      "code": "CS-401",
      "name": "Advanced Algorithms"
    }
  ]
}
```

---

### DELETE `/api/faculty/:facultyId/subjects/:subjectId`
Remove subject assignment from faculty.

**Response (200):**
```json
{
  "message": "Subject assignment removed."
}
```

---

### GET `/api/subjects/:subjectId/students`
Get enrolled students for a subject.

**Query Parameters:**
- `page` (optional)
- `limit` (optional)

**Response (200):**
```json
{
  "subject": {
    "id": "uuid",
    "code": "CS-401",
    "name": "Advanced Algorithms"
  },
  "students": [
    {
      "id": "uuid",
      "name": "Aditi Sharma",
      "usn": "1RV21CS001",
      "programme": "Computer Science",
      "semester": "6th Sem",
      "email": "aditi.s@univ.edu.in",
      "enrolledAt": "2023-09-01T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### POST `/api/subjects/:subjectId/enroll`
Enroll students in subject.

**Request Body:**
```json
{
  "studentIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (200):**
```json
{
  "message": "Students enrolled successfully.",
  "enrolledCount": 3
}
```

---

### DELETE `/api/subjects/:subjectId/enroll/:studentId`
Unenroll student from subject.

**Response (200):**
```json
{
  "message": "Student unenrolled successfully."
}
```

---

## 📁 File Download Endpoints

### GET `/api/notes/:id/download`
Download note file.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
- `200` - File stream
- `404` - Note not found
- `403` - Access denied

---

### GET `/api/textbooks/:id/download`
Download textbook file.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
- `200` - File stream
- `404` - Textbook not found

---

### GET `/api/assignments/:id/resources/:resourceId/download`
Download assignment resource file.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
- `200` - File stream
- `404` - Resource not found

---

### GET `/api/submissions/:id/files/:fileId/download`
Download submission file.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
- `200` - File stream
- `404` - File not found
- `403` - Access denied (only student owner or faculty can download)

---

## 📊 Export Endpoints

### GET `/api/admin/students/export`
Export students list as CSV.

**Query Parameters:**
- Same filters as GET `/api/admin/students`

**Response:**
- `200` - CSV file download

---

### GET `/api/assignments/:id/submissions/export`
Export submissions as CSV.

**Response:**
- `200` - CSV file download

---

## 🔍 Search Endpoints

### GET `/api/search`
Global search (for authenticated users).

**Query Parameters:**
- `q` (required) - Search query
- `type` (optional) - Filter by type: `assignments`, `notes`, `textbooks`, `students`

**Response (200):**
```json
{
  "results": {
    "assignments": [...],
    "notes": [...],
    "textbooks": [...],
    "students": [...]
  }
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

---

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute per IP
- File upload endpoints: 10 requests per minute

---

## Notes for Implementation

1. **File Storage**: Use cloud storage (AWS S3, Google Cloud Storage, or Supabase Storage) for file uploads
2. **Pagination**: All list endpoints should support pagination
3. **Filtering**: Implement server-side filtering for all list endpoints
4. **Validation**: Validate all input data on the server
5. **Authorization**: Check user roles and permissions for all endpoints
6. **CORS**: Configure CORS to allow requests from frontend origin
7. **Error Handling**: Implement consistent error handling and logging
8. **File Size Limits**: 
   - Notes: 10MB max
   - Textbooks: 50MB max
   - Assignment files: 25MB max per file, 100MB total
9. **Token Expiry**: Access tokens expire after 1 hour, refresh tokens after 7 days
