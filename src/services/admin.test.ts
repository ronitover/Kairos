import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './api'
import { adminPendingUploadsService } from './admin'
import type { PendingUpload } from './admin'

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const mockGet = vi.mocked(apiClient.get)

describe('AdminPendingUploadsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPendingUploads', () => {
    it('returns pending list from API and formats date', async () => {
      const pending: PendingUpload[] = [
        {
          id: 'note-1',
          student: 'Jane Doe',
          usn: '1RV21CS001',
          title: 'Unit 3 Notes',
          format: 'PDF',
          date: '2024-01-20T14:30:00Z',
          status: 'pending',
        },
      ]
      mockGet.mockResolvedValue({ data: { pending } })

      const result = await adminPendingUploadsService.getPendingUploads()

      expect(mockGet).toHaveBeenCalledWith('/admin/pending-notes')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('note-1')
      expect(result[0].student).toBe('Jane Doe')
      expect(result[0].title).toBe('Unit 3 Notes')
      expect(result[0].format).toBe('PDF')
      expect(result[0].status).toBe('pending')
      // ISO date is formatted to locale string
      expect(result[0].date).toMatch(/\d{1,2}/)
      expect(result[0].date).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
    })

    it('returns empty array when API returns empty pending', async () => {
      mockGet.mockResolvedValue({ data: { pending: [] } })

      const result = await adminPendingUploadsService.getPendingUploads()

      expect(result).toEqual([])
    })

    it('returns empty array when API returns no pending key', async () => {
      mockGet.mockResolvedValue({ data: {} } as { data: { pending?: PendingUpload[] } })

      const result = await adminPendingUploadsService.getPendingUploads()

      expect(result).toEqual([])
    })

    it('leaves date unchanged when not ISO format', async () => {
      const pending: PendingUpload[] = [
        {
          id: 'n1',
          student: 'A',
          usn: 'U',
          title: 'T',
          format: 'PDF',
          date: 'Oct 24, 2023',
          status: 'pending',
        },
      ]
      mockGet.mockResolvedValue({ data: { pending } })

      const result = await adminPendingUploadsService.getPendingUploads()

      expect(result[0].date).toBe('Oct 24, 2023')
    })

    it('throws when API returns error', async () => {
      mockGet.mockResolvedValue({ error: { message: 'Unauthorized', code: 'ERR' } })

      await expect(adminPendingUploadsService.getPendingUploads()).rejects.toThrow('Unauthorized')
    })

    it('throws when response has no data', async () => {
      mockGet.mockResolvedValue({})

      await expect(adminPendingUploadsService.getPendingUploads()).rejects.toThrow(
        /Failed to load pending uploads/
      )
    })
  })
})
