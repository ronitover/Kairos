import { apiClient } from './api'
import { assignmentService } from './assignments'

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

export interface UnofficialUploadItem {
  id: string
  title: string
  chapter: string
  uploadedAt: string
  status: 'pending' | 'verified' | 'rejected'
  fileName: string
  fileSize: number
  fileUrl: string
}

export interface DiscoverUnofficialItem {
  id: string
  title: string
  chapter: string
  uploadedAt: string
  uploader: {
    id: string
    name: string
    usn: string
  }
  fileName: string
  fileUrl: string
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

    let dashboardAssignments: StudentDashboard['assignments'] = []
    try {
      const assignmentsWithSubmissions = await assignmentService.getStudentAssignments()
      dashboardAssignments = assignmentsWithSubmissions.map((a) => {
        const status: 'pending' | 'submitted' | 'graded' = !a.submission
          ? 'pending'
          : a.submission.grade
            ? 'graded'
            : 'submitted'
        return {
          id: a.id,
          title: a.title,
          subjectCode: a.subjectCode || 'SUBJECT',
          dueDate: a.dueDate,
          status,
          submittedAt: a.submission?.submittedAt,
          grade: a.submission?.grade?.grade,
        }
      })
    } catch {
      // If assignments/submissions fail, return empty list; dashboard still shows rest
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
      assignments: dashboardAssignments,
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

  async getUnofficialNotesData(filters?: {
    search?: string
    chapter?: string
  }): Promise<{
    myUploads: UnofficialUploadItem[]
    discover: DiscoverUnofficialItem[]
    defaultSubjectName?: string
  }> {
    const meResponse = await apiClient.get<{
      user: { id: string }
      profile?: { programme?: string; semester?: number }
    }>('/me')
    if (meResponse.error || !meResponse.data) {
      throw new Error(meResponse.error?.message || 'Failed to load profile')
    }

    const myUploadsResponse = await apiClient.get<{
      notes: Array<{
        id: string
        title: string
        chapter: string | null
        uploaded_at: string
        status: 'pending' | 'verified' | 'rejected'
        note_files?: Array<{
          file_name: string
          file_size: number
          file_url: string
        }>
      }>
    }>('/notes', { type: 'unofficial' })
    if (myUploadsResponse.error || !myUploadsResponse.data) {
      throw new Error(myUploadsResponse.error?.message || 'Failed to load your uploads')
    }

    const discoverResponse = await apiClient.get<{
      notes: Array<{
        id: string
        title: string
        chapter: string | null
        uploadedAt: string
        uploader: { id: string; name: string; usn: string }
        file?: {
          file_name: string
          file_url: string
        } | null
      }>
    }>('/notes/unofficial/discover', {
      search: filters?.search,
      chapter: filters?.chapter,
    })
    if (discoverResponse.error || !discoverResponse.data) {
      throw new Error(discoverResponse.error?.message || 'Failed to load discover notes')
    }

    const subjectsResponse = await apiClient.get<{
      subjects: Array<{ id: string; name: string }>
    }>('/subjects', {
      programme: meResponse.data.profile?.programme || undefined,
      semester: meResponse.data.profile?.semester || undefined,
    })

    const defaultSubjectName =
      subjectsResponse.data?.subjects?.[0]?.name ||
      meResponse.data.profile?.programme ||
      'General'

    return {
      myUploads: myUploadsResponse.data.notes.map((note) => ({
        id: note.id,
        title: note.title,
        chapter: note.chapter || '-',
        uploadedAt: note.uploaded_at,
        status: note.status,
        fileName: note.note_files?.[0]?.file_name || note.title,
        fileSize: Number(note.note_files?.[0]?.file_size || 0),
        fileUrl: note.note_files?.[0]?.file_url || '#',
      })),
      discover: discoverResponse.data.notes.map((note) => ({
        id: note.id,
        title: note.title,
        chapter: note.chapter || '-',
        uploadedAt: note.uploadedAt,
        uploader: note.uploader,
        fileName: note.file?.file_name || note.title,
        fileUrl: note.file?.file_url || '#',
      })),
      defaultSubjectName,
    }
  }
}

export const studentService = new StudentService()
