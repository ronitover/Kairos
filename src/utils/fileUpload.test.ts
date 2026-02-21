import { describe, it, expect } from 'vitest'
import {
  validateFile,
  formatFileSize,
  FileUploadError,
  createFilePreview,
  revokeMockFileUrl,
  createMockFileUrl,
} from './fileUpload'

describe('fileUpload', () => {
  describe('validateFile', () => {
    it('throws when file exceeds maxSize', () => {
      const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 100 * 1024 * 1024 })
      expect(() => validateFile(file, { maxSize: 50 * 1024 * 1024 })).toThrow(FileUploadError)
      expect(() => validateFile(file, { maxSize: 50 * 1024 * 1024 })).toThrow(/exceeds maximum/)
    })

    it('throws when file type is not allowed', () => {
      const file = new File(['x'], 'a.exe', { type: 'application/octet-stream' })
      expect(() =>
        validateFile(file, { allowedTypes: ['application/pdf', 'image/png'] })
      ).toThrow(FileUploadError)
      expect(() =>
        validateFile(file, { allowedTypes: ['application/pdf'] })
      ).toThrow(/not allowed/)
    })

    it('does not throw when file is within size and type allowed', () => {
      const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })
      expect(() =>
        validateFile(file, { maxSize: 10 * 1024 * 1024, allowedTypes: ['application/pdf'] })
      ).not.toThrow()
    })
  })

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(500)).toBe('500 B')
    })
    it('formats KB', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })
    it('formats MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    })
    it('formats GB', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB')
    })
  })

  describe('createMockFileUrl / revokeMockFileUrl', () => {
    it('creates and revokes blob URL', () => {
      const file = new File(['x'], 'a.txt', { type: 'text/plain' })
      const url = createMockFileUrl(file)
      expect(url).toMatch(/^blob:/)
      revokeMockFileUrl(url)
      // revoke does not throw
    })
  })

  describe('createFilePreview', () => {
    it('rejects for non-image file', async () => {
      const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })
      await expect(createFilePreview(file)).rejects.toThrow(/not an image/)
    })
  })
})
