import { apiClient } from './api'

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
    status?: 'pending' | 'submitted' | 'graded'
  }): Promise<Assignment[]> {
    const response = await apiClient.get<{
      assignments: Array<{
        id: string
        title: string
        instructions: string
        total_marks: number
        due_date: string
        allow_late_submission: boolean
        subject_id: string
        subjects?: { code?: string }
      }>
    }>('/assignments')

    if (response.error || !response.data) {
      throw new Error(response.error?.message || 'Failed to load assignments')
    }

    let mapped = response.data.assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subjectId: assignment.subject_id,
      subjectCode: assignment.subjects?.code || 'SUBJECT',
      instructions: assignment.instructions,
      totalMarks: assignment.total_marks,
      dueDate: assignment.due_date,
      allowLateSubmission: assignment.allow_late_submission,
      resources: [],
      submission: { id: '', status: 'pending' as const, submittedAt: '', files: [] },
    }))

    if (filters?.subjectId) {
      mapped = mapped.filter((assignment) => assignment.subjectId === filters.subjectId)
    }
    if (filters?.status) {
      mapped = mapped.filter((assignment) => assignment.submission?.status === filters.status)
    }

    return mapped
  }

  async getAssignment(id: string): Promise<Assignment> {
    const response = await apiClient.get<{
      assignment: {
        id: string
        title: string
        instructions: string
        total_marks: number
        due_date: string
        allow_late_submission: boolean
        subject_id: string
        subjects?: { code?: string }
        assignment_resources?: Array<{
          id: string
          file_name: string
          file_url: string
        }>
      }
      submission?: {
        id: string
        status: 'submitted' | 'late' | 'pending'
        submitted_at: string
        comment?: string | null
        submission_files?: Array<{
          id: string
          file_name: string
          file_size: number
          uploaded_at: string
        }>
        grades?: Array<{
          marks: number
          grade: string
          feedback: string
          graded_at: string
        }>
      } | null
    }>(`/assignments/${id}`)

    if (response.error || !response.data) {
      throw new Error(response.error?.message || 'Failed to load assignment details')
    }

    const submission = response.data.submission
      ? {
          id: response.data.submission.id,
          status: response.data.submission.status,
          submittedAt: response.data.submission.submitted_at,
          files: (response.data.submission.submission_files ?? []).map((file) => ({
            id: file.id,
            fileName: file.file_name,
            fileSize: Number(file.file_size || 0),
            uploadedAt: file.uploaded_at,
          })),
          comment: response.data.submission.comment || undefined,
          grade: response.data.submission.grades?.[0]
            ? {
                marks: response.data.submission.grades[0].marks,
                grade: response.data.submission.grades[0].grade,
                feedback: response.data.submission.grades[0].feedback,
                gradedAt: response.data.submission.grades[0].graded_at,
              }
            : undefined,
        }
      : undefined

    return {
      id: response.data.assignment.id,
      title: response.data.assignment.title,
      subjectId: response.data.assignment.subject_id,
      subjectCode: response.data.assignment.subjects?.code || 'SUBJECT',
      instructions: response.data.assignment.instructions,
      totalMarks: response.data.assignment.total_marks,
      dueDate: response.data.assignment.due_date,
      allowLateSubmission: response.data.assignment.allow_late_submission,
      resources: (response.data.assignment.assignment_resources ?? []).map((resource) => ({
        id: resource.id,
        fileName: resource.file_name,
        fileUrl: resource.file_url,
      })),
      submission,
    }
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
    const assignment = await this.getAssignment(assignmentId)
    return assignment.submission || null
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
        subject_id: string
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
      subjectId: response.data.assignment.subjects?.id || response.data.assignment.subject_id || data.subjectId,
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
    }>
  }> {
    const response = await apiClient.get<{
      assignment: {
        id: string
        title: string
        instructions: string
        total_marks: number
        due_date: string
        allow_late_submission: boolean
        subject_id: string
        subjects?: { code?: string }
      }
      submissions: Array<{
        id: string
        status: string
        is_late: boolean
        submitted_at: string
        students?: {
          id: string
          full_name: string
          usn: string
        }
        grades?: Array<{
          marks: number
          grade: string
          feedback: string
          graded_at: string
        }>
      }>
    }>(`/assignments/${assignmentId}/submissions`)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Failed to load submissions')

    return {
      assignment: {
        id: response.data.assignment.id,
        title: response.data.assignment.title,
        subjectId: response.data.assignment.subject_id,
        subjectCode: response.data.assignment.subjects?.code || 'SUBJECT',
        instructions: response.data.assignment.instructions,
        totalMarks: response.data.assignment.total_marks,
        dueDate: response.data.assignment.due_date,
        allowLateSubmission: response.data.assignment.allow_late_submission,
      },
      submissions: response.data.submissions.map((submission) => ({
        id: submission.id,
        student: {
          id: submission.students?.id || '',
          name: submission.students?.full_name || 'Student',
          usn: submission.students?.usn || 'NA',
        },
        submittedAt: submission.submitted_at,
        status: submission.status,
        isLate: Boolean(submission.is_late),
        grade: submission.grades?.[0]
          ? {
              marks: submission.grades[0].marks,
              grade: submission.grades[0].grade,
              feedback: submission.grades[0].feedback,
              gradedAt: submission.grades[0].graded_at,
            }
          : undefined,
      })),
    }
  }
}

export const assignmentService = new AssignmentService()
