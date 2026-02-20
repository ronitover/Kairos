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
    void filters
    // TODO: Replace with actual API call
    // const response = await apiClient.get<Assignment[]>('/students/assignments', { params: filters })
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'assign-1',
            title: 'Implement Multi-threaded Scheduler',
            subjectId: 'subj-1',
            subjectCode: 'CS501',
            instructions: 'Implement a multi-threaded scheduler...',
            totalMarks: 50,
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            allowLateSubmission: true,
            submission: {
              id: 'sub-1',
              status: 'pending',
              submittedAt: '',
              files: [],
            },
          },
          {
            id: 'assign-2',
            title: 'Memory Mapping Lab Report',
            subjectId: 'subj-1',
            subjectCode: 'CS501',
            instructions: 'Write a lab report on memory mapping...',
            totalMarks: 50,
            dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            allowLateSubmission: true,
            submission: {
              id: 'sub-2',
              status: 'submitted',
              submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              files: [],
            },
          },
          {
            id: 'assign-3',
            title: 'CPU Scheduling Quiz',
            subjectId: 'subj-1',
            subjectCode: 'CS501',
            instructions: 'Complete the quiz on CPU scheduling...',
            totalMarks: 50,
            dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            allowLateSubmission: false,
            submission: {
              id: 'sub-3',
              status: 'submitted',
              submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              files: [],
              grade: {
                marks: 45,
                grade: 'A+',
                feedback: 'Excellent work!',
                gradedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              },
            },
          },
        ])
      }, 500)
    })
  }

  async getAssignment(id: string): Promise<Assignment> {
    // TODO: Replace with actual API call
    // const response = await apiClient.get<Assignment>(`/assignments/${id}`)
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          title: 'Assignment 2 - SQL Joins',
          subjectId: 'subj-1',
          subjectCode: 'CS501',
          instructions:
            'In this assignment, you are required to demonstrate your understanding of complex SQL Joins...',
          totalMarks: 50,
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          allowLateSubmission: true,
          resources: [
            {
              id: 'res-1',
              fileName: 'Database_Schema.pdf',
              fileUrl: '/mock/file1.pdf',
            },
            {
              id: 'res-2',
              fileName: 'Sample_Data.docx',
              fileUrl: '/mock/file2.docx',
            },
          ],
        })
      }, 500)
    })
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
    void assignmentId
    // TODO: Replace with actual API call
    // const response = await apiClient.get<Submission>(`/assignments/${assignmentId}/submission`)
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'sub-1',
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          files: [
            {
              id: 'file-1',
              fileName: 'sql_joins_solution.sql',
              fileSize: 1024000,
              uploadedAt: new Date().toISOString(),
            },
          ],
        })
      }, 500)
    })
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
    }>
  }> {
    // TODO: Replace with actual API call
    // const response = await apiClient.get(`/assignments/${assignmentId}/submissions`)
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          assignment: {
            id: assignmentId,
            title: 'Memory Mapping Lab',
            subjectId: 'subj-1',
            subjectCode: 'CS301',
            instructions: '...',
            totalMarks: 50,
            dueDate: new Date().toISOString(),
            allowLateSubmission: true,
          },
          submissions: [
            {
              id: 'sub-1',
              student: {
                id: 'stud-1',
                name: 'Aditi Mishra',
                usn: '1RV21CS001',
              },
              submittedAt: new Date().toISOString(),
              status: 'submitted',
              isLate: false,
            },
          ],
        })
      }, 500)
    })
  }
}

export const assignmentService = new AssignmentService()
import { apiClient } from './api'
