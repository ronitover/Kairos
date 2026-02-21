import { apiClient } from './api'

interface RawAssignment {
  id: string
  title: string
  subject_id: string
  instructions: string
  total_marks: number
  due_date: string
  allow_late_submission: boolean
  subjects?: { id: string; name: string; code: string }
}
interface RawSubmissionFile {
  id: string
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
  uploaded_at?: string
}
interface RawGrade {
  id: string
  marks: number
  grade: string | null
  feedback: string | null
  graded_at?: string
  is_released?: boolean
}
interface RawSubmission {
  id: string
  status: string
  submitted_at: string | null
  comment?: string | null
  submission_files?: RawSubmissionFile[]
  grades?: RawGrade[]
}
function mapRawAssignmentToAssignment(
  a: RawAssignment,
  submission?: Submission
): Assignment {
  return {
    id: a.id,
    title: a.title,
    subjectId: a.subject_id,
    subjectCode: a.subjects?.code ?? '',
    instructions: a.instructions ?? '',
    totalMarks: a.total_marks ?? 0,
    dueDate: a.due_date,
    allowLateSubmission: a.allow_late_submission ?? false,
    submission,
  }
}

export interface Assignment {
  id: string
  title: string
  subjectId: string
  subjectCode: string
  instructions: string
  totalMarks: number
  dueDate: string
  allowLateSubmission: boolean
  resources?: AssignmentResource[]
  submission?: Submission
}

export interface AssignmentResource {
  id: string
  fileName: string
  fileUrl: string
}

export interface Submission {
  id: string
  status: 'submitted' | 'late' | 'pending'
  submittedAt: string
  files: SubmissionFile[]
  comment?: string
  grade?: Grade
}

export interface SubmissionFile {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
}

export interface Grade {
  marks: number
  grade: string
  feedback: string
  gradedAt: string
}

class AssignmentService {
  async getStudentAssignments(filters?: {
    subjectId?: string
    subjectName?: string
    status?: 'pending' | 'submitted' | 'graded'
  }): Promise<Assignment[]> {
    const params: Record<string, string | undefined> = {}
    if (filters?.subjectName) params.subjectName = filters.subjectName
    const response = await apiClient.get<{ assignments: RawAssignment[] }>('/assignments', params)
    if (response.error) throw new Error(response.error.message)
    const list = response.data?.assignments ?? []
    let assignments: Assignment[] = await Promise.all(
      list.map(async (a) => {
        const subRes = await apiClient.get<{ submission: RawSubmission | null }>(
          `/assignments/${a.id}/submission`
        )
        const sub = subRes.data?.submission ?? null
        const submission: Submission | undefined = sub
          ? {
              id: sub.id,
              status: (sub.status as 'submitted' | 'late' | 'pending') || 'pending',
              submittedAt: sub.submitted_at ?? '',
              files: (sub.submission_files ?? []).map((f: RawSubmissionFile) => ({
                id: f.id,
                fileName: f.file_name,
                fileSize: f.file_size ?? 0,
                uploadedAt: f.uploaded_at ?? '',
              })),
              comment: sub.comment ?? undefined,
              grade: (() => {
                const g = Array.isArray(sub.grades) ? sub.grades[0] : sub.grades
                return g
                  ? {
                      marks: g.marks,
                      grade: g.grade ?? '',
                      feedback: g.feedback ?? '',
                      gradedAt: g.graded_at ?? '',
                    }
                  : undefined
              })(),
            }
          : undefined
        return mapRawAssignmentToAssignment(a, submission)
      })
    )
    if (filters?.subjectId)
      assignments = assignments.filter((a) => a.subjectId === filters.subjectId)
    if (filters?.status) {
      assignments = assignments.filter((a) => {
        if (!a.submission) return filters.status === 'pending'
        if (a.submission.grade) return filters.status === 'graded'
        return filters.status === 'submitted'
      })
    }
    return assignments
  }

  async getAssignments(params?: { subjectName?: string }): Promise<Assignment[]> {
    const response = await apiClient.get<{ assignments: RawAssignment[] }>('/assignments', params)
    if (response.error) throw new Error(response.error.message)
    const list = response.data?.assignments ?? []
    return list.map((a) => mapRawAssignmentToAssignment(a))
  }

  async getAssignment(id: string): Promise<Assignment> {
    const response = await apiClient.get<{ assignment: RawAssignment }>(`/assignments/${id}`)
    if (response.error) throw new Error(response.error.message)
    if (!response.data?.assignment) throw new Error('Assignment not found')
    return mapRawAssignmentToAssignment(response.data.assignment)
  }

  async submitAssignment(
    assignmentId: string,
    files: File[],
    comment?: string
  ): Promise<Submission> {
    if (files.length === 0) {
      throw new Error('Please attach at least one file.')
    }

    const formData = new FormData()
    // Backend currently supports one file per request for submissions.
    formData.append('file', files[0])
    if (comment) formData.append('comment', comment)

    const response = await apiClient.uploadFile<{ submission: {
      id: string
      status: 'submitted' | 'late' | 'pending'
      submitted_at: string
      comment?: string | null
    } }>(`/assignments/${assignmentId}/submit`, formData)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Submission failed')

    return {
      id: response.data.submission.id,
      status: response.data.submission.status,
      submittedAt: response.data.submission.submitted_at,
      files: files.map((file, idx) => ({
        id: `local-${idx}`,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      })),
      comment: response.data.submission.comment || undefined,
    }
  }

  async getSubmission(assignmentId: string): Promise<Submission | null> {
    const response = await apiClient.get<{ submission: RawSubmission | null }>(
      `/assignments/${assignmentId}/submission`
    )
    if (response.error) throw new Error(response.error.message)
    const sub = response.data?.submission ?? null
    if (!sub)
      return null
    const g = Array.isArray(sub.grades) ? sub.grades[0] : sub.grades
    return {
      id: sub.id,
      status: (sub.status as 'submitted' | 'late' | 'pending') || 'pending',
      submittedAt: sub.submitted_at ?? '',
      files: (sub.submission_files ?? []).map((f) => ({
        id: f.id,
        fileName: f.file_name,
        fileSize: f.file_size ?? 0,
        uploadedAt: f.uploaded_at ?? '',
      })),
      comment: sub.comment ?? undefined,
      grade: g
        ? {
            marks: g.marks,
            grade: g.grade ?? '',
            feedback: g.feedback ?? '',
            gradedAt: g.graded_at ?? '',
          }
        : undefined,
    }
  }

  async createAssignment(data: {
    title: string
    subjectId: string
    instructions: string
    totalMarks: number
    dueDate: string
    allowLateSubmission: boolean
    resources?: File[]
  }): Promise<Assignment> {
    const response = await apiClient.post<{
      assignment: {
        id: string
        title: string
        instructions: string
        total_marks: number
        due_date: string
        allow_late_submission: boolean
        subjects?: { id: string; code: string }
      }
    }>('/assignments', {
      title: data.title,
      subjectId: data.subjectId,
      instructions: data.instructions,
      totalMarks: data.totalMarks,
      dueDate: data.dueDate,
      allowLateSubmission: data.allowLateSubmission,
    })

    if (response.error || !response.data) throw new Error(response.error?.message || 'Failed to create assignment')

    return {
      id: response.data.assignment.id,
      title: response.data.assignment.title,
      subjectId: response.data.assignment.subjects?.id || data.subjectId,
      subjectCode: response.data.assignment.subjects?.code || '',
      instructions: response.data.assignment.instructions,
      totalMarks: response.data.assignment.total_marks,
      dueDate: response.data.assignment.due_date,
      allowLateSubmission: response.data.assignment.allow_late_submission,
      resources: [],
    }
  }

  async getAssignmentSubmissions(assignmentId: string): Promise<{
    assignment: Assignment
    submissions: Array<{
      id: string
      student: {
        id: string
        name: string
        usn: string
      }
      submittedAt: string
      status: string
      isLate: boolean
      grade?: Grade
      files?: Array<{ id: string; fileName: string; fileUrl: string; fileSize?: number; uploadedAt?: string }>
    }>
  }> {
    const response = await apiClient.get<{
      assignment: RawAssignment
      submissions: Array<{
        id: string
        students: { id: string; full_name: string; usn: string } | null
        submitted_at: string
        status: string
        is_late: boolean
        submission_files?: RawSubmissionFile[]
        grades?: RawGrade[]
      }>
    }>(`/assignments/${assignmentId}/submissions`)
    if (response.error) throw new Error(response.error.message)
    const data = response.data
    if (!data) throw new Error('Failed to load submissions')
    const assignment = mapRawAssignmentToAssignment(data.assignment)
    const submissions = (data.submissions ?? []).map((s) => {
      const g = Array.isArray(s.grades) ? s.grades[0] : s.grades
      return {
        id: s.id,
        student: {
          id: s.students?.id ?? '',
          name: s.students?.full_name ?? '',
          usn: s.students?.usn ?? '',
        },
        submittedAt: s.submitted_at,
        status: s.status,
        isLate: s.is_late ?? false,
        grade: g
          ? {
              marks: g.marks,
              grade: g.grade ?? '',
              feedback: g.feedback ?? '',
              gradedAt: g.graded_at ?? '',
            }
          : undefined,
        files: (s.submission_files ?? []).map((f) => ({
          id: f.id,
          fileName: f.file_name,
          fileUrl: f.file_url,
          fileSize: f.file_size,
          uploadedAt: f.uploaded_at,
        })),
      }
    })
    return { assignment, submissions }
  }

  async gradeSubmission(
    submissionId: string,
    payload: { marks: number; grade?: string; feedback?: string; isReleased?: boolean }
  ): Promise<void> {
    const response = await apiClient.patch(`/submissions/${submissionId}/grade`, {
      marks: payload.marks,
      grade: payload.grade,
      feedback: payload.feedback,
      isReleased: payload.isReleased,
    })
    if (response.error) throw new Error(response.error.message)
  }
}

export const assignmentService = new AssignmentService()
