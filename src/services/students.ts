import { apiClient } from './api'

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
    const meResponse = await apiClient.get<{
      user: { id: string; email: string }
      profile?: { full_name?: string; usn?: string; programme?: string; semester?: number }
    }>('/me')
    if (meResponse.error || !meResponse.data) {
      throw new Error(meResponse.error?.message || 'Failed to load student profile')
    }

    const student = {
      id: meResponse.data.user.id,
      fullName: meResponse.data.profile?.full_name || 'Student',
      usn: meResponse.data.profile?.usn || '',
      programme: meResponse.data.profile?.programme || '',
      semester: String(meResponse.data.profile?.semester || ''),
      email: meResponse.data.user.email,
    }

    const subjectsResponse = await apiClient.get<{
      subjects: Array<{
        id: string
        code: string
        name: string
      }>
    }>('/subjects', {
      programme: student.programme || undefined,
      semester: student.semester || undefined,
    })
    if (subjectsResponse.error || !subjectsResponse.data) {
      throw new Error(subjectsResponse.error?.message || 'Failed to load subjects')
    }

    const notesResponse = await apiClient.get<{
      notes: Array<{
        id: string
        title: string
        chapter: string | null
        uploaded_at: string
        note_files?: Array<{ file_url: string }>
      }>
    }>('/notes', { type: 'official', status: 'verified' })
    if (notesResponse.error || !notesResponse.data) {
      throw new Error(notesResponse.error?.message || 'Failed to load notes')
    }

    const assignmentsResponse = await apiClient.get<{
      assignments: Array<{
        id: string
        title: string
        due_date: string
        subjects?: { code?: string }
      }>
    }>('/assignments')
    if (assignmentsResponse.error || !assignmentsResponse.data) {
      throw new Error(assignmentsResponse.error?.message || 'Failed to load assignments')
    }

    return {
      student,
      enrolledSubjects: subjectsResponse.data.subjects.map((subject) => ({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        faculty: {
          id: '',
          name: 'Faculty',
        },
      })),
      assignments: assignmentsResponse.data.assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        subjectCode: assignment.subjects?.code || 'SUBJECT',
        dueDate: assignment.due_date,
        status: 'pending',
      })),
      recentNotes: notesResponse.data.notes.slice(0, 10).map((note) => ({
        id: note.id,
        title: note.title,
        chapter: note.chapter || '-',
        facultyName: 'Faculty',
        uploadedAt: note.uploaded_at,
        downloadUrl: note.note_files?.[0]?.file_url || '#',
      })),
      textbooks: [],
    }
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
