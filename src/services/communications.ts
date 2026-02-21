import { apiClient } from './api'

export type NoticeRole = 'admin' | 'faculty'
export type EventRole = 'faculty' | 'admin'
export type EventAudience = 'students' | 'faculty' | 'both'
export type EventType = 'assignment' | 'test' | 'holiday' | 'event'

export interface NoticeDto {
  id: string
  title: string
  content: string
  created_at: string
  author_name: string
  created_by_role: NoticeRole
  urgent: boolean
}

export interface EventDto {
  id: string
  title: string
  event_date: string
  event_type: EventType
  details: string
  created_by_role: EventRole
  target_audience: EventAudience
  created_by_name?: string
}

class CommunicationsService {
  async getNotices(): Promise<NoticeDto[]> {
    const response = await apiClient.get<{ notices: NoticeDto[] }>('/notices')
    if (response.error || !response.data) throw new Error(response.error?.message || 'Failed to load notices')
    return response.data.notices
  }

  async createNotice(input: {
    title: string
    content: string
    urgent: boolean
  }): Promise<NoticeDto> {
    const response = await apiClient.post<{ notice: NoticeDto }>('/notices', input)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Failed to create notice')
    return response.data.notice
  }

  async deleteNotice(noticeId: string): Promise<void> {
    const response = await apiClient.delete(`/notices/${noticeId}`)
    if (response.error) throw new Error(response.error.message)
  }

  async getAcademicEvents(): Promise<EventDto[]> {
    const response = await apiClient.get<{ events: EventDto[] }>('/academic-events')
    if (response.error || !response.data) throw new Error(response.error?.message || 'Failed to load events')
    return response.data.events
  }

  async createAcademicEvent(input: {
    title: string
    date: string
    type: EventType
    details: string
    targetAudience?: EventAudience
  }): Promise<EventDto> {
    const response = await apiClient.post<{ event: EventDto }>('/academic-events', input)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Failed to create event')
    return response.data.event
  }

  async deleteAcademicEvent(eventId: string): Promise<void> {
    const response = await apiClient.delete(`/academic-events/${eventId}`)
    if (response.error) throw new Error(response.error.message)
  }
}

export const communicationsService = new CommunicationsService()
