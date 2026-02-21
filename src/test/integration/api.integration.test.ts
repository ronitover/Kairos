import { describe, it, expect } from 'vitest'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

async function fetchApi(path: string, options: RequestInit = {}): Promise<Response | null> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  return fetch(url, { headers: { Accept: 'application/json', ...options.headers }, ...options }).catch(
    () => null
  )
}

describe('API integration', () => {
  it('GET /health returns ok', async () => {
    const base = API_BASE.replace(/\/api\/?$/, '')
    const res = await fetch(`${base}/health`).catch(() => null)
    if (!res) {
      console.warn('Backend not reachable at', base, '- skipping health check')
      return
    }
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(data).toHaveProperty('ok', true)
  })

  it('GET /api/me without token returns 401', async () => {
    const res = await fetchApi('/me')
    if (!res) return
    expect(res.status).toBe(401)
  })

  it('GET /api/notices without token returns 401', async () => {
    const res = await fetchApi('/notices')
    if (!res) return
    expect(res.status).toBe(401)
  })

  it('GET /api/academic-events without token returns 401', async () => {
    const res = await fetchApi('/academic-events')
    if (!res) return
    expect(res.status).toBe(401)
  })

  it('GET /api/admin/pending-notes without token returns 401', async () => {
    const res = await fetchApi('/admin/pending-notes')
    if (!res) return
    expect(res.status).toBe(401)
  })

  it('DELETE /api/academic-events/:id without token returns 401', async () => {
    const res = await fetchApi('/academic-events/some-id', { method: 'DELETE' })
    if (!res) return
    expect(res.status).toBe(401)
  })

  it('POST /api/notices without token returns 401', async () => {
    const res = await fetchApi('/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'T', content: 'C', urgent: false }),
    })
    if (!res) return
    expect(res.status).toBe(401)
  })

  it('POST /api/academic-events without token returns 401', async () => {
    const res = await fetchApi('/academic-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E',
        date: '2024-06-01',
        type: 'event',
        details: 'D',
        targetAudience: 'both',
      }),
    })
    if (!res) return
    expect(res.status).toBe(401)
  })
})
