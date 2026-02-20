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
    // TODO: Replace with actual API call
    // const response = await apiClient.post<AuthResponse>('/auth/student/register', data)
    // if (response.error) throw new Error(response.error.message)
    // this.saveSession(response.data.session, response.data.user)
    // return response.data

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResponse: AuthResponse = {
          user: {
            id: 'mock-student-id',
            email: data.email,
            role: 'student',
            fullName: data.fullName,
            usn: data.usn,
            programme: data.programme,
            semester: data.semester,
          },
          session: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          },
        }
        this.saveSession(mockResponse.session, mockResponse.user)
        resolve(mockResponse)
      }, 1000)
    })
  }

  async studentLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    // TODO: Replace with actual API call
    // const response = await apiClient.post<AuthResponse>('/auth/student/login', credentials)
    // if (response.error) throw new Error(response.error.message)
    // this.saveSession(response.data.session, response.data.user)
    // return response.data

    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.email && credentials.password) {
          const mockResponse: AuthResponse = {
            user: {
              id: 'mock-student-id',
              email: credentials.email,
              role: 'student',
              fullName: 'Mock Student',
              usn: '1RV21CS001',
              programme: 'Computer Science & Engineering',
              semester: '6',
            },
            session: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              expiresAt: Math.floor(Date.now() / 1000) + 3600,
            },
          }
          this.saveSession(mockResponse.session, mockResponse.user)
          resolve(mockResponse)
        } else {
          reject(new Error('Invalid credentials'))
        }
      }, 1000)
    })
  }

  async facultyLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    // TODO: Replace with actual API call
    // const response = await apiClient.post<AuthResponse>('/auth/faculty/login', credentials)
    // if (response.error) throw new Error(response.error.message)
    // this.saveSession(response.data.session, response.data.user)
    // return response.data

    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.email && credentials.password) {
          const mockResponse: AuthResponse = {
            user: {
              id: 'mock-faculty-id',
              email: credentials.email,
              role: 'faculty',
              name: 'Dr. Sarah Jenkins',
              department: 'Computer Science',
            },
            session: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              expiresAt: Math.floor(Date.now() / 1000) + 3600,
            },
          }
          this.saveSession(mockResponse.session, mockResponse.user)
          resolve(mockResponse)
        } else {
          reject(new Error('Invalid credentials'))
        }
      }, 1000)
    })
  }

  async adminLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    // TODO: Replace with actual API call
    // const response = await apiClient.post<AuthResponse>('/auth/admin/login', credentials)
    // if (response.error) throw new Error(response.error.message)
    // this.saveSession(response.data.session, response.data.user)
    // return response.data

    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.email && credentials.password) {
          const mockResponse: AuthResponse = {
            user: {
              id: 'mock-admin-id',
              email: credentials.email,
              role: 'admin',
              name: 'Admin User',
            },
            session: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              expiresAt: Math.floor(Date.now() / 1000) + 3600,
            },
          }
          this.saveSession(mockResponse.session, mockResponse.user)
          resolve(mockResponse)
        } else {
          reject(new Error('Invalid credentials'))
        }
      }, 1000)
    })
  }

  async logout(): Promise<void> {
    // TODO: Call logout endpoint
    // await apiClient.post('/auth/logout')
    this.clearSession()
  }

  async forgotPassword(email: string): Promise<void> {
    // TODO: Replace with actual API call
    // await apiClient.post('/auth/forgot-password', { email })

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('[Mock] Password reset email sent to', email)
        resolve()
      }, 1000)
    })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    void token
    void newPassword
    // TODO: Replace with actual API call
    // await apiClient.post('/auth/reset-password', { token, newPassword })

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('[Mock] Password reset successful')
        resolve()
      }, 1000)
    })
  }

  async getCurrentUserProfile(): Promise<User> {
    // TODO: Replace with actual API call
    // const response = await apiClient.get<User>('/auth/me')
    // if (response.error) throw new Error(response.error.message)
    // return response.data

    // Mock implementation
    const user = this.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    return user
  }
}

export const authService = new AuthService()
