import { apiClient } from './api'

export interface AdminDashboard {
  stats: {
    totalStudents: number
    totalFaculty: number
    totalSubjects: number
    pendingVerifications: number
  }
  recentActivities: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
}

export interface Student {
  id: string
  fullName: string
  usn: string
  programme: string
  semester: string
  email: string
  status: 'active' | 'disabled'
  registeredAt: string
}

export interface Faculty {
  id: string
  name: string
  email: string
  department: string
  designation: string
  assignedSubjectsCount: number
  status: 'active' | 'disabled'
  joinDate: string
}

export interface Subject {
  id: string
  code: string
  name: string
  programme: string
  semester: string
}

class AdminService {
  async getDashboard(): Promise<AdminDashboard> {
    // TODO: Replace with actual API call
    // const response = await apiClient.get<AdminDashboard>('/admin/dashboard')
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          stats: {
            totalStudents: 12482,
            totalFaculty: 845,
            totalSubjects: 312,
            pendingVerifications: 58,
          },
          recentActivities: [
            {
              id: 'act-1',
              type: 'student_registered',
              description: 'David Smith (ID: ST2024001) has completed the portal registration.',
              timestamp: new Date().toISOString(),
            },
          ],
        })
      }, 500)
    })
  }

  async getStudents(filters?: {
    search?: string
    programme?: string
    semester?: string
    status?: string
  }): Promise<Student[]> {
    void filters
    // TODO: Replace with actual API call
    // const response = await apiClient.get<Student[]>('/admin/students', { params: filters })
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'stud-1',
            fullName: 'Aditi Sharma',
            usn: '1RV21CS001',
            programme: 'Computer Science & Engineering',
            semester: '6',
            email: 'aditi.s@univ.edu.in',
            status: 'active',
            registeredAt: new Date().toISOString(),
          },
        ])
      }, 500)
    })
  }

  async getFaculty(filters?: {
    search?: string
    department?: string
    status?: string
  }): Promise<Faculty[]> {
    void filters
    // TODO: Replace with actual API call
    // const response = await apiClient.get<Faculty[]>('/admin/faculty', { params: filters })
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'fac-1',
            name: 'Dr. David Anderson',
            email: 'd.anderson@university.edu',
            department: 'Computer Science',
            designation: 'Senior Professor',
            assignedSubjectsCount: 4,
            status: 'active',
            joinDate: new Date().toISOString(),
          },
        ])
      }, 500)
    })
  }

  async getSubjects(filters?: {
    programme?: string
    semester?: string
  }): Promise<Subject[]> {
    const response = await apiClient.get<{ subjects: Array<{
      id: string
      code: string
      name: string
      programme: string
      semester: number
    }> }>('/subjects', filters)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Failed to load subjects')
    return response.data.subjects.map((subject) => ({
      ...subject,
      semester: String(subject.semester),
    }))
  }

  async assignSubjectsToFaculty(
    facultyId: string,
    subjectIds: string[]
  ): Promise<void> {
    const response = await apiClient.post(`/faculty/${facultyId}/subjects`, { subjectIds })
    if (response.error) throw new Error(response.error.message)
  }

  async enrollStudentsInSubject(
    subjectId: string,
    studentIds: string[]
  ): Promise<void> {
    const response = await apiClient.post(`/subjects/${subjectId}/enroll`, { studentIds })
    if (response.error) throw new Error(response.error.message)
  }

  async getStudent(id: string): Promise<Student | null> {
    const list = await this.getStudents()
    return list.find((s) => s.id === id) ?? null
  }

  async getFacultyById(id: string): Promise<Faculty | null> {
    const list = await this.getFaculty()
    return list.find((f) => f.id === id) ?? null
  }

  async createFaculty(_data: {
    name: string
    email: string
    department: string
    designation?: string
    temporaryPassword: string
  }): Promise<void> {
    await new Promise((r) => setTimeout(r, 500))
    throw new Error('Create faculty is not implemented. Connect to backend to create faculty accounts.')
  }
}

export interface PendingUpload {
  id: string
  student: string
  usn: string
  title: string
  format: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
}

class AdminPendingUploadsService {
  async getPendingUploads(): Promise<PendingUpload[]> {
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve([
            { id: 'upload-1', student: 'Aditi Sharma', usn: '1RV21CS001', title: 'OS Unit 3 Notes', format: 'PDF', date: 'Oct 24, 2023', status: 'pending' },
            { id: 'upload-2', student: 'Rahul Jayaram', usn: '1RV21IS045', title: 'DBMS Normalization Guide', format: 'DOCX', date: 'Oct 23, 2023', status: 'pending' },
            { id: 'upload-3', student: 'Priya Kapoor', usn: '1RV20EC112', title: 'Network Topology Diagrams', format: 'PNG', date: 'Oct 20, 2023', status: 'pending' },
          ]),
        300
      )
    })
  }
}

export const adminPendingUploadsService = new AdminPendingUploadsService()

export const adminService = new AdminService()
