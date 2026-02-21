import { apiClient } from './api'

export interface User {
  id: string
  email: string
  role: 'student' | 'faculty' | 'admin'
  fullName?: string
  usn?: string
  programme?: string
  semester?: string
  name?: string
  department?: string
}

export interface AuthResponse {
  user: User
  session: {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface StudentRegisterData {
  fullName: string
  usn: string
  programme: string
  semester: string
  email: string
  password: string
}

class AuthService {
  // Store session in localStorage
  private saveSession(session: AuthResponse['session'], user: User) {
    localStorage.setItem('auth_token', session.accessToken)
    localStorage.setItem('refresh_token', session.refreshToken)
    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_expires_at', session.expiresAt.toString())
  }

  private clearSession() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_expires_at')
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('auth_user')
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token')
    const expiresAt = localStorage.getItem('auth_expires_at')
    if (!token || !expiresAt) return false
    return Date.now() < parseInt(expiresAt) * 1000
  }

  async studentRegister(data: StudentRegisterData): Promise<AuthResponse> {
    const registerResponse = await apiClient.post<{
      user: { id: string; email: string; role: 'student' }
      message: string
    }>('/auth/student/register', data)
    if (registerResponse.error) throw new Error(registerResponse.error.message)

    // Backend registration does not return session, so login immediately.
    return this.studentLogin({ email: data.email, password: data.password })
  }

  async studentLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/student/login', credentials)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Login failed')
    this.saveSession(response.data.session, response.data.user)
    return response.data
  }

  async facultyLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/faculty/login', credentials)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Login failed')
    this.saveSession(response.data.session, response.data.user)
    return response.data
  }

  async adminLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/admin/login', credentials)
    if (response.error || !response.data) throw new Error(response.error?.message || 'Login failed')
    this.saveSession(response.data.session, response.data.user)
    return response.data
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Proceed with local clear even if backend call fails
    }
    this.clearSession()
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email })
    if (response.error) throw new Error(response.error.message)
  }

  async resetPassword(accessToken: string, newPassword: string): Promise<void> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', {
      accessToken,
      newPassword,
    })
    if (response.error) throw new Error(response.error.message)
  }

  async getCurrentUserProfile(): Promise<User> {
    const response = await apiClient.get<{
      user: {
        id: string
        email: string
        role: 'student' | 'faculty' | 'admin'
      }
      profile?: {
        full_name?: string
        usn?: string
        programme?: string
        semester?: number
        name?: string
        department?: string
      }
    }>('/me')
    if (response.error || !response.data) throw new Error(response.error?.message || 'Not authenticated')

    const mappedUser: User = {
      id: response.data.user.id,
      email: response.data.user.email,
      role: response.data.user.role,
      fullName: response.data.profile?.full_name,
      usn: response.data.profile?.usn,
      programme: response.data.profile?.programme,
      semester: response.data.profile?.semester ? String(response.data.profile.semester) : undefined,
      name: response.data.profile?.name,
      department: response.data.profile?.department,
    }

    localStorage.setItem('auth_user', JSON.stringify(mappedUser))
    return mappedUser
  }
}

export const authService = new AuthService()
