const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    const url = new URL(`${API_BASE_URL}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        url.searchParams.set(key, String(value))
      })
    }
    return url.toString()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken()
    const headers = new Headers(options.headers)
    const isFormData = options.body instanceof FormData
    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    try {
      const response = await fetch(this.buildUrl(endpoint, params), {
        ...options,
        headers,
      })
      const raw = await response.text()
      let payload: unknown = null
      if (raw) {
        try {
          payload = JSON.parse(raw)
        } catch {
          payload = { message: raw }
        }
      }

      if (!response.ok) {
        const payloadMessage =
          typeof payload === 'object' && payload !== null && 'message' in payload
            ? String((payload as { message?: unknown }).message ?? '')
            : ''
        return {
          error: {
            code: `HTTP_${response.status}`,
            message: payloadMessage || `Request failed with status ${response.status}`,
            details: payload,
          },
        }
      }

      return { data: payload as T }
    } catch (error) {
      return {
        error: {
          code: 'REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Request failed',
        },
      }
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, params)
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    })
  }
}

export const apiClient = new ApiClient()
