import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from './api'

describe('ApiClient', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.clear()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('builds URL with query params', async () => {
    const mockRes = new Response(JSON.stringify({ data: 1 }), { status: 200 })
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes)

    await apiClient.get('/test', { a: '1', b: '2' })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.any(Object)
    )
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('a=1')
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('b=2')
  })

  it('sends Authorization when token in localStorage', async () => {
    localStorage.setItem('auth_token', 'secret')
    const mockRes = new Response(JSON.stringify({}), { status: 200 })
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes)

    await apiClient.get('/me')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    )
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers
    expect(headers.get('Authorization')).toBe('Bearer secret')
  })

  it('returns error when response not ok', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
    )

    const result = await apiClient.get<{ x: number }>('/protected')

    expect(result.error).toBeDefined()
    expect(result.error?.message).toContain('Unauthorized')
    expect(result.data).toBeUndefined()
  })
})
