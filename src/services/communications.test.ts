import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './api'
import { communicationsService } from './communications'
import type { NoticeDto, EventDto } from './communications'

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockDelete = vi.mocked(apiClient.delete)

describe('CommunicationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getNotices', () => {
    it('returns notices from API', async () => {
      const notices: NoticeDto[] = [
        {
          id: 'n1',
          title: 'Test Notice',
          content: 'Body',
          created_at: '2024-01-15T10:00:00Z',
          author_name: 'Admin',
          created_by_role: 'admin',
          urgent: false,
        },
      ]
      mockGet.mockResolvedValue({ data: { notices } })

      const result = await communicationsService.getNotices()

      expect(mockGet).toHaveBeenCalledWith('/notices')
      expect(result).toEqual(notices)
    })

    it('throws when API returns error', async () => {
      mockGet.mockResolvedValue({ error: { message: 'Server error', code: 'ERR' } })

      await expect(communicationsService.getNotices()).rejects.toThrow('Server error')
    })

    it('throws when response has no data', async () => {
      mockGet.mockResolvedValue({})

      await expect(communicationsService.getNotices()).rejects.toThrow(/Failed to load notices/)
    })
  })

  describe('createNotice', () => {
    it('sends input and returns created notice', async () => {
      const created: NoticeDto = {
        id: 'n2',
        title: 'New',
        content: 'Content',
        created_at: '2024-01-16T12:00:00Z',
        author_name: 'Faculty',
        created_by_role: 'faculty',
        urgent: true,
      }
      mockPost.mockResolvedValue({ data: { notice: created } })

      const result = await communicationsService.createNotice({
        title: 'New',
        content: 'Content',
        urgent: true,
      })

      expect(mockPost).toHaveBeenCalledWith('/notices', {
        title: 'New',
        content: 'Content',
        urgent: true,
      })
      expect(result).toEqual(created)
    })

    it('throws when API returns error', async () => {
      mockPost.mockResolvedValue({ error: { message: 'Forbidden', code: 'ERR' } })

      await expect(
        communicationsService.createNotice({ title: 'X', content: 'Y', urgent: false })
      ).rejects.toThrow('Forbidden')
    })
  })

  describe('deleteNotice', () => {
    it('calls DELETE and does not throw on success', async () => {
      mockDelete.mockResolvedValue({})

      await communicationsService.deleteNotice('n1')

      expect(mockDelete).toHaveBeenCalledWith('/notices/n1')
    })

    it('throws when API returns error', async () => {
      mockDelete.mockResolvedValue({ error: { message: 'Not found', code: 'ERR' } })

      await expect(communicationsService.deleteNotice('n99')).rejects.toThrow('Not found')
    })
  })

  describe('getAcademicEvents', () => {
    it('returns events from API', async () => {
      const events: EventDto[] = [
        {
          id: 'e1',
          title: 'Mid-term',
          event_date: '2024-02-01',
          event_type: 'test',
          details: 'Room 101',
          created_by_role: 'faculty',
          target_audience: 'students',
          created_by_name: 'Dr. Smith',
        },
      ]
      mockGet.mockResolvedValue({ data: { events } })

      const result = await communicationsService.getAcademicEvents()

      expect(mockGet).toHaveBeenCalledWith('/academic-events')
      expect(result).toEqual(events)
    })

    it('throws when API returns error', async () => {
      mockGet.mockResolvedValue({ error: { message: 'Unauthorized', code: 'ERR' } })

      await expect(communicationsService.getAcademicEvents()).rejects.toThrow('Unauthorized')
    })
  })

  describe('createAcademicEvent', () => {
    it('sends input and returns created event', async () => {
      const created: EventDto = {
        id: 'e2',
        title: 'Holiday',
        event_date: '2024-03-15',
        event_type: 'holiday',
        details: 'Break',
        created_by_role: 'admin',
        target_audience: 'both',
      }
      mockPost.mockResolvedValue({ data: { event: created } })

      const result = await communicationsService.createAcademicEvent({
        title: 'Holiday',
        date: '2024-03-15',
        type: 'holiday',
        details: 'Break',
        targetAudience: 'both',
      })

      expect(mockPost).toHaveBeenCalledWith('/academic-events', {
        title: 'Holiday',
        date: '2024-03-15',
        type: 'holiday',
        details: 'Break',
        targetAudience: 'both',
      })
      expect(result).toEqual(created)
    })
  })

  describe('deleteAcademicEvent', () => {
    it('calls DELETE and does not throw on success', async () => {
      mockDelete.mockResolvedValue({})

      await communicationsService.deleteAcademicEvent('e1')

      expect(mockDelete).toHaveBeenCalledWith('/academic-events/e1')
    })

    it('throws when API returns error', async () => {
      mockDelete.mockResolvedValue({ error: { message: 'Forbidden', code: 'ERR' } })

      await expect(communicationsService.deleteAcademicEvent('e99')).rejects.toThrow('Forbidden')
    })
  })
})
