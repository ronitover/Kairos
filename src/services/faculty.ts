export interface FacultyDashboard {
  faculty: {
    id: string
    name: string
    email: string
    department: string
  }
  assignedSubjects: Array<{
    id: string
    code: string
    name: string
    enrolledStudents: number
  }>
  pendingVerifications: number
  recentAssignments: Array<{
    id: string
    title: string
    subjectCode: string
    dueDate: string
  }>
  officialNotes: Array<{
    id: string
    title: string
    chapter: string
    uploadedAt: string
  }>
}

export interface PendingNote {
  id: string
  title: string
  student: {
    id: string
    name: string
    usn: string
  }
  chapter: string
  uploadedAt: string
  status: 'pending' | 'verified' | 'rejected'
  downloadUrl: string
}

class FacultyService {
  async getDashboard(): Promise<FacultyDashboard> {
    // TODO: Replace with actual API call
    // const response = await apiClient.get<FacultyDashboard>('/faculty/dashboard')
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          faculty: {
            id: 'fac-1',
            name: 'Dr. Sarah Jenkins',
            email: 'sarah.jenkins@univ.edu.in',
            department: 'Computer Science',
          },
          assignedSubjects: [
            {
              id: 'subj-1',
              code: 'CS501',
              name: 'Operating Systems',
              enrolledStudents: 60,
            },
          ],
          pendingVerifications: 5,
          recentAssignments: [],
          officialNotes: [
            {
              id: 'note-1',
              title: 'Virtual Memory Architecture',
              chapter: 'Unit 4',
              uploadedAt: new Date().toISOString(),
            },
          ],
        })
      }, 500)
    })
  }

  async getPendingNotes(): Promise<PendingNote[]> {
    // TODO: Replace with actual API call
    // const response = await apiClient.get<PendingNote[]>('/faculty/notes/verification')
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'note-1',
            title: 'Virtual Memory Deep Dive',
            student: {
              id: 'stud-1',
              name: 'Aditya Kulkarni',
              usn: '1MS21CS004',
            },
            chapter: 'Unit 3',
            uploadedAt: new Date().toISOString(),
            status: 'pending',
            downloadUrl: '/mock/note1.pdf',
          },
        ])
      }, 500)
    })
  }

  async verifyNote(noteId: string, action: 'approve' | 'reject'): Promise<void> {
    // TODO: Replace with actual API call
    // const endpoint = action === 'approve' ? `/notes/${noteId}/verify` : `/notes/${noteId}/reject`
    // const response = await apiClient.post(endpoint, { action })
    // if (response.error) throw new Error(response.error.message)

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[Mock] Note ${noteId} ${action}d`)
        resolve()
      }, 500)
    })
  }

  async uploadOfficialNote(data: {
    file: File
    title: string
    chapter: string
    subjectId: string
  }): Promise<{ id: string }> {
    void data
    // TODO: Replace with actual API call
    // const formData = new FormData()
    // formData.append('file', data.file)
    // formData.append('title', data.title)
    // formData.append('chapter', data.chapter)
    // formData.append('subjectId', data.subjectId)
    // const response = await apiClient.uploadFile('/faculty/notes/official', formData)
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'note-new',
        })
      }, 1500)
    })
  }

  async uploadTextbook(data: {
    file: File
    title: string
    author: string
    edition: string
    subjectId?: string
  }): Promise<{ id: string }> {
    void data
    // TODO: Replace with actual API call
    // const formData = new FormData()
    // formData.append('file', data.file)
    // formData.append('title', data.title)
    // formData.append('author', data.author)
    // formData.append('edition', data.edition)
    // if (data.subjectId) formData.append('subjectId', data.subjectId)
    // const response = await apiClient.uploadFile('/textbooks', formData)
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'book-new',
        })
      }, 1500)
    })
  }
}

export const facultyService = new FacultyService()
