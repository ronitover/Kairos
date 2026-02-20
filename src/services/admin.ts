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
    void filters
    // TODO: Replace with actual API call
    // const response = await apiClient.get<Subject[]>('/subjects', { params: filters })
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'subj-1',
            code: 'CS-401',
            name: 'Advanced Algorithms',
            programme: 'B.Tech CSE',
            semester: 'Sem IV',
          },
        ])
      }, 500)
    })
  }

  async assignSubjectsToFaculty(
    facultyId: string,
    subjectIds: string[]
  ): Promise<void> {
    // TODO: Replace with actual API call
    // const response = await apiClient.post(`/faculty/${facultyId}/subjects`, { subjectIds })
    // if (response.error) throw new Error(response.error.message)

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[Mock] Assigning subjects ${subjectIds.join(', ')} to faculty ${facultyId}`)
        resolve()
      }, 1000)
    })
  }

  async enrollStudentsInSubject(
    subjectId: string,
    studentIds: string[]
  ): Promise<void> {
    // TODO: Replace with actual API call
    // const response = await apiClient.post(`/subjects/${subjectId}/enroll`, { studentIds })
    // if (response.error) throw new Error(response.error.message)

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[Mock] Enrolling students ${studentIds.join(', ')} in subject ${subjectId}`)
        resolve()
      }, 1000)
    })
  }
}

export const adminService = new AdminService()
