import { apiClient } from './api'

export interface TextbookItem {
  id: string
  title: string
  author: string
  edition: string | null
  subjectId: string | null
  subjectCode: string | null
  subjectName: string | null
  uploadedBy: string
  uploadedByName: string
  uploadedAt: string
  file: {
    name: string
    url: string
    size: number
    type: string | null
    uploadedAt: string
  } | null
}

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
    programme: string
    semester: number
    enrolledStudents: number
  }>
  pendingVerifications: number
  pendingNotes: Array<{
    id: string
    title: string
    chapter: string | null
    uploadedAt: string
    status: 'pending' | 'verified' | 'rejected'
    student: {
      id: string
      name: string
      usn: string
    }
  }>
  verificationNotes?: Array<{
    id: string
    title: string
    chapter: string | null
    uploadedAt: string
    status: 'pending' | 'verified' | 'rejected'
    student: {
      id: string
      name: string
      usn: string
    }
  }>
  recentAssignments: Array<{
    id: string
    title: string
    subjectCode: string
    dueDate: string
    submissionCount: number
    isClosed: boolean
  }>
  officialNotes: Array<{
    id: string
    title: string
    chapter: string | null
    uploadedAt: string
    subjectCode: string
  }>
  textbooks: Array<{
    id: string
    name: string
    size: string
    createdTime: string
    webViewLink: string
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
    const response = await apiClient.get<FacultyDashboard>('/faculty/dashboard')
    if (response.error || !response.data) {
      throw new Error(response.error?.message || 'Failed to load faculty dashboard')
    }
    return response.data
  }

  async getPendingNotes(): Promise<PendingNote[]> {
    const dashboard = await this.getDashboard()
    const notes = dashboard.verificationNotes ?? dashboard.pendingNotes
    return notes.map((note) => ({
      id: note.id,
      title: note.title,
      student: note.student,
      chapter: note.chapter || '',
      uploadedAt: note.uploadedAt,
      status: note.status,
      downloadUrl: '#',
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
    subjectId: string
  }): Promise<{ id: string }> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('title', data.title)
    formData.append('author', data.author)
    if (data.edition) formData.append('edition', data.edition)
    formData.append('subjectId', data.subjectId)
    const response = await apiClient.uploadFile<{ textbook: { id: string } }>('/textbooks', formData)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Upload failed')
    return { id: response.data.textbook.id }
  }

  async getTextbooks(): Promise<TextbookItem[]> {
    const response = await apiClient.get<{ textbooks: TextbookItem[] }>('/textbooks?mine=true')
    if (response.error || !response.data) throw new Error(response.error?.message || 'Failed to load textbooks')
    return response.data.textbooks
  }

  async deleteTextbook(textbookId: string): Promise<void> {
    const response = await apiClient.delete(`/textbooks/${textbookId}`)
    if (response.error) throw new Error(response.error.message)
  }
}

export const facultyService = new FacultyService()
