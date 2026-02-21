import { apiClient } from './api'

export interface DriveFile {
  id: string
  name: string
  mimeType?: string
  size?: number
  createdTime?: string
  webViewLink?: string
  webContentLink?: string
  appProperties?: Record<string, string>
}

export interface ListFilesParams {
  subjectName?: string
  category?: string
  uploadedBy?: string
}

class FilesService {
  async listFiles(params?: ListFilesParams): Promise<DriveFile[]> {
    const query: Record<string, string> = {}
    if (params?.subjectName) query.subjectName = params.subjectName
    if (params?.category) query.category = params.category
    if (params?.uploadedBy) query.uploadedBy = params.uploadedBy
    const response = await apiClient.get<{ files: DriveFile[] }>('/files', query)
    if (response.error) throw new Error(response.error.message)
    return response.data?.files ?? []
  }
}

export const filesService = new FilesService()
