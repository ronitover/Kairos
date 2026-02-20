export interface StudentDashboard {
  student: {
    id: string
    fullName: string
    usn: string
    programme: string
    semester: string
    email: string
  }
  enrolledSubjects: Array<{
    id: string
    code: string
    name: string
    faculty: {
      id: string
      name: string
    }
  }>
  assignments: Array<{
    id: string
    title: string
    subjectCode: string
    dueDate: string
    status: 'pending' | 'submitted' | 'graded'
    submittedAt?: string
    grade?: string
  }>
  recentNotes: Array<{
    id: string
    title: string
    chapter: string
    facultyName: string
    uploadedAt: string
    downloadUrl: string
  }>
  textbooks: Array<{
    id: string
    title: string
    author: string
    edition: string
    downloadUrl: string
  }>
}

class StudentService {
  async getDashboard(): Promise<StudentDashboard> {
    // TODO: Replace with actual API call
    // const response = await apiClient.get<StudentDashboard>('/students/dashboard')
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          student: {
            id: 'stud-1',
            fullName: 'Alex Thompson',
            usn: '1RV21CS001',
            programme: 'Computer Science & Engineering',
            semester: '5',
            email: 'alex@univ.edu.in',
          },
          enrolledSubjects: [
            {
              id: 'subj-1',
              code: 'CS501',
              name: 'Operating Systems',
              faculty: {
                id: 'fac-1',
                name: 'Dr. Robert Wilson',
              },
            },
          ],
          assignments: [],
          recentNotes: [
            {
              id: 'note-1',
              title: 'Memory Management Overview',
              chapter: 'Chapter 4',
              facultyName: 'Dr. Robert Wilson',
              uploadedAt: new Date().toISOString(),
              downloadUrl: '/mock/note1.pdf',
            },
          ],
          textbooks: [
            {
              id: 'book-1',
              title: 'Operating System Concepts',
              author: 'Silberschatz, Galvin, Gagne',
              edition: '10th Edition',
              downloadUrl: '/mock/book1.pdf',
            },
          ],
        })
      }, 500)
    })
  }

  async uploadUnofficialNote(data: {
    file: File
    title: string
    chapter?: string
    subjectId?: string
    subjectName?: string
  }): Promise<{ id: string; status: string }> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('title', data.title)
    if (data.chapter) formData.append('chapter', data.chapter)
    if (data.subjectId) formData.append('subjectId', data.subjectId)
    if (data.subjectName) formData.append('subjectName', data.subjectName)

    const response = await apiClient.uploadFile<{ note: { id: string; status: string } }>('/notes/unofficial', formData)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Upload failed')
    return { id: response.data.note.id, status: response.data.note.status }
  }
}

export const studentService = new StudentService()
import { apiClient } from './api'
