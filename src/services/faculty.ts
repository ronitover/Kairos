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
    const response = await apiClient.get<{ notes: Array<{
      id: string
      title: string
      chapter: string | null
      uploaded_at: string
      status: 'pending' | 'verified' | 'rejected'
      students?: {
        id: string
        full_name: string
        usn: string
      }
      note_files?: Array<{
        file_url: string
      }>
      uploaded_by: string
    }> }>('/notes', { type: 'unofficial', status: 'pending' })
    if (response.error || !response.data) throw new Error(response.error?.message || 'Failed to load pending notes')

    return response.data.notes.map((note) => ({
      id: note.id,
      title: note.title,
      student: {
        id: note.students?.id || note.uploaded_by,
        name: note.students?.full_name || 'Student',
        usn: note.students?.usn || 'NA',
      },
      chapter: note.chapter || '',
      uploadedAt: note.uploaded_at,
      status: note.status,
      downloadUrl: note.note_files?.[0]?.file_url || '#',
    }))
  }

  async verifyNote(noteId: string, action: 'approve' | 'reject'): Promise<void> {
    const response = await apiClient.patch(`/notes/${noteId}/verify`, {
      status: action === 'approve' ? 'approved' : 'rejected',
    })
    if (response.error) throw new Error(response.error.message)
  }

  async uploadOfficialNote(data: {
    file: File
    title: string
    chapter: string
    subjectId: string
  }): Promise<{ id: string }> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('title', data.title)
    formData.append('chapter', data.chapter)
    formData.append('subjectId', data.subjectId)
    const response = await apiClient.uploadFile<{ note: { id: string } }>('/notes/official', formData)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Upload failed')
    return { id: response.data.note.id }
  }

  async uploadTextbook(data: {
    file: File
    title: string
    author: string
    edition: string
    subjectId?: string
  }): Promise<{ id: string }> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('fileName', data.title)
    formData.append('category', 'textbook')
    if (data.subjectId) formData.append('subjectId', data.subjectId)
    const response = await apiClient.uploadFile<{ file: { id: string } }>('/files/upload', formData)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Upload failed')
    return { id: response.data.file.id }
  }
}

export const facultyService = new FacultyService()
import { apiClient } from './api'
