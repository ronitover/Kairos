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
  email: string | null
  status: 'active' | 'disabled'
  registeredAt: string
}

export interface Faculty {
  id: string
  name: string
  email: string | null
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
    const response = await apiClient.get<AdminDashboard>('/admin/dashboard')
    if (response.error) throw new Error(response.error.message)
    if (!response.data) throw new Error('Failed to load dashboard')
    return response.data
  }

  async getStudents(filters?: {
    search?: string
    programme?: string
    semester?: string
    status?: string
  }): Promise<Student[]> {
    const response = await apiClient.get<{ students: Student[] }>('/admin/students', filters)
    if (response.error) throw new Error(response.error.message)
    const list = response.data?.students ?? []
    return list.map((s) => ({ ...s, email: s.email ?? '' }))
  }

  async getFaculty(filters?: {
    search?: string
    department?: string
    status?: string
  }): Promise<Faculty[]> {
    const response = await apiClient.get<{ faculty: Faculty[] }>('/admin/faculty', filters)
    if (response.error) throw new Error(response.error.message)
    const list = response.data?.faculty ?? []
    return list.map((f) => ({ ...f, email: f.email ?? '' }))
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

  async createFaculty(data: {
    name: string
    email: string
    department: string
    designation?: string
    temporaryPassword: string
  }): Promise<void> {
    const response = await apiClient.post('/auth/faculty/register', {
      name: data.name,
      email: data.email,
      department: data.department,
      designation: data.designation,
      temporaryPassword: data.temporaryPassword,
    })
    if (response.error) throw new Error(response.error.message)
  }

  async sendStudentPasswordResetEmail(studentId: string): Promise<void> {
    const response = await apiClient.post<{ message: string }>(
      `/admin/students/${encodeURIComponent(studentId)}/send-reset-password`
    )
    if (response.error) throw new Error(response.error.message)
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
    const response = await apiClient.get<{ pending: PendingUpload[] }>('/admin/pending-notes')
    if (response.error || !response.data) throw new Error(response.error?.message ?? 'Failed to load pending uploads')
    const list = response.data.pending ?? []
    return list.map((p) => ({
      ...p,
      date: typeof p.date === 'string' && p.date.includes('T') ? new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : p.date,
    }))
  }
}

export const adminPendingUploadsService = new AdminPendingUploadsService()

export const adminService = new AdminService()
