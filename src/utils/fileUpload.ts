// File upload utilities - Ready for backend integration

export interface FileUploadOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  onProgress?: (progress: number) => void
}

export interface UploadedFile {
  id: string
  fileName: string
  fileSize: number
  fileUrl: string
  fileType: string
}

export class FileUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileUploadError'
  }
}

export function validateFile(file: File, options: FileUploadOptions = {}): void {
  const { maxSize = 50 * 1024 * 1024, allowedTypes = [] } = options // Default 50MB

  if (file.size > maxSize) {
    throw new FileUploadError(
      `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
    )
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new FileUploadError(`File type ${file.type} is not allowed`)
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

export function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    } else {
      reject(new Error('File is not an image'))
    }
  })
}

export function createMockFileUrl(file: File): string {
  // Mock file URL - will be replaced with actual upload
  return URL.createObjectURL(file)
}

export function revokeMockFileUrl(url: string): void {
  URL.revokeObjectURL(url)
}
