import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext'
import { authService } from './services/auth'
import { assignmentService } from './services/assignments'
import { facultyService } from './services/faculty'
import { validateFile, FileUploadError } from './utils/fileUpload'

type RoutePath =
  | '/'
  | '/student_login'
  | '/student_register'
  | '/faculty_login'
  | '/admin_login'
  | '/admin_dashboard'
  | '/admin_faculty_accounts'
  | '/admin_assign_subjects'
  | '/admin_student_accounts'
  | '/admin_circulars'
  | '/admin_enroll_students'
  | '/admin_review_uploads'
  | '/admin_student_details'
  | '/admin_faculty_details'
  | '/forgot_password'
  | '/reset_password'
  | '/faculty_dashboard'
  | '/faculty_verification'
  | '/faculty_textbook_upload'
  | '/faculty_create_assignment'
  | '/faculty_assignment_submissions'
  | '/faculty_grade_submission'
  | '/student_dashboard'
  | '/search_results'
  | '/repository'
  | '/assignment_review'
  | '/assignment_result'
  | '/unofficial_notes'

type UploadStatus = 'verified' | 'pending' | 'rejected'

type UploadedNote = {
  id: string
  title: string
  uploadedOn: string
  fileInfo: string
  status: UploadStatus
  canDownload: boolean
  downloadUrl?: string
  fileName?: string
}

const SUPPORTED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
] as const

const SUPPORTED_UPLOAD_ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png'
const SUPPORTED_UPLOAD_LABEL = 'PDF, PPT/PPTX, DOC/DOCX, JPG/PNG'

function enforceSupportedUploadFile(file: File, maxSizeInBytes: number): void {
  validateFile(file, {
    maxSize: maxSizeInBytes,
    allowedTypes: [...SUPPORTED_UPLOAD_MIME_TYPES],
  })
}

type DepartmentNotice = {
  id: string
  title: string
  content: string
  createdAt: string
  author: string
  authorRole: 'admin' | 'faculty'
  urgent: boolean
}

const defaultDepartmentNotices: DepartmentNotice[] = [
  {
    id: 'notice-1',
    title: 'Mid-Sem Exam Schedule Published',
    content: 'Exam timetable for all 4th and 6th semester students is now available in the portal.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    author: 'Admin Office',
    authorRole: 'admin',
    urgent: true,
  },
  {
    id: 'notice-2',
    title: 'Library Access Extended',
    content: 'Department library will remain open until 8:00 PM during project submission week.',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    author: 'Library Coordinator',
    authorRole: 'admin',
    urgent: false,
  },
]

function isNoticeNew(createdAt: string): boolean {
  const createdMs = new Date(createdAt).getTime()
  if (Number.isNaN(createdMs)) {
    return false
  }
  return Date.now() - createdMs <= 24 * 60 * 60 * 1000
}

const roleHomeRoute: Record<'student' | 'faculty' | 'admin', RoutePath> = {
  student: '/student_dashboard',
  faculty: '/faculty_dashboard',
  admin: '/admin_dashboard',
}

const roleLoginRoute: Record<'student' | 'faculty' | 'admin', RoutePath> = {
  student: '/student_login',
  faculty: '/faculty_login',
  admin: '/admin_login',
}

type HeaderNavItem = {
  label: string
  path: RoutePath
}

function BrandIdentity({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand-identity ${small ? 'small' : ''}`} aria-label="StudySync">
      <div className="brand-logo-placeholder">Logo</div>
      <span>StudySync</span>
    </div>
  )
}

function CommonDashboardHeader({
  title,
  subtitle,
  navItems,
  currentPath,
  onNavigate,
  onLogout,
  containerClassName,
}: {
  title: string
  subtitle: string
  navItems: HeaderNavItem[]
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
  containerClassName: string
}) {
  const { user } = useAuth()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const displayName = user?.name || user?.fullName || 'User'

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current) {
        return
      }
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <>
      <header className="dashboard-header common-dashboard-header">
        <div className={`${containerClassName} common-dashboard-top-row`}>
          <BrandIdentity />

          <div className="dashboard-user common-profile-wrap" ref={profileMenuRef}>
            <div className="dashboard-user-info">
              <p>{displayName}</p>
              <p>{subtitle}</p>
            </div>
            <button
              type="button"
              className="common-profile-trigger"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              aria-label="Open profile menu"
            >
              <div className="dashboard-avatar">
                <span className="material-symbols-outlined">account_circle</span>
              </div>
            </button>
            <div className={`common-profile-menu ${isProfileMenuOpen ? 'open' : ''}`} role="menu">
              <button type="button" onClick={onLogout} className="common-dashboard-logout" role="menuitem">
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="dashboard-header-accent" />
      </header>
      <div className={`${containerClassName} common-dashboard-controls`}>
        <h1>{title}</h1>
        <nav className="common-dashboard-nav" aria-label="Dashboard sections">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={currentPath === item.path ? 'active' : ''}
              onClick={() => {
                setIsProfileMenuOpen(false)
                onNavigate(item.path)
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

function CommonDashboardFooter({
  containerClassName,
  caption,
}: {
  containerClassName: string
  caption: string
}) {
  return (
    <footer className={`dashboard-footer ${containerClassName}`}>
      <div>
        <p>{caption}</p>
      </div>
      <nav aria-label="Footer links">
        <a href="#">Help Center</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Support</a>
      </nav>
    </footer>
  )
}

function PdfPreviewModal({
  isOpen,
  title,
  onClose,
}: {
  isOpen: boolean
  title: string
  onClose: () => void
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="pdf-preview-overlay" role="dialog" aria-modal="true" aria-label="PDF preview">
      <div className="pdf-preview-modal">
        <header className="pdf-preview-head">
          <div>
            <span className="material-symbols-outlined">description</span>
            <h3>{title}</h3>
          </div>
          <div>
            <button type="button" className="pdf-preview-download">
              <span className="material-symbols-outlined">download</span>
              Download
            </button>
            <button type="button" className="pdf-preview-close" onClick={onClose} aria-label="Close preview">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>
        <div className="pdf-preview-body">
          <div className="pdf-preview-page">
            <p>PDF preview placeholder</p>
            <h4>{title}</h4>
            <p>Preview content will render here when backend file streaming is connected.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function getRequiredRole(route: RoutePath): 'student' | 'faculty' | 'admin' | null {
  if (
    route === '/student_dashboard' ||
    route === '/search_results' ||
    route === '/repository' ||
    route === '/assignment_review' ||
    route === '/assignment_result' ||
    route === '/unofficial_notes'
  ) {
    return 'student'
  }

  if (
    route === '/faculty_dashboard' ||
    route === '/faculty_verification' ||
    route === '/faculty_textbook_upload' ||
    route === '/faculty_create_assignment' ||
    route === '/faculty_assignment_submissions' ||
    route === '/faculty_grade_submission'
  ) {
    return 'faculty'
  }

  if (
    route === '/admin_dashboard' ||
    route === '/admin_faculty_accounts' ||
    route === '/admin_assign_subjects' ||
    route === '/admin_student_accounts' ||
    route === '/admin_circulars' ||
    route === '/admin_enroll_students' ||
    route === '/admin_review_uploads' ||
    route === '/admin_student_details' ||
    route === '/admin_faculty_details'
  ) {
    return 'admin'
  }

  return null
}

const initialUploadedNotes: UploadedNote[] = [
  {
    id: 'upload-1',
    title: 'OS - Deadlocks Short Notes',
    uploadedOn: 'Uploaded on Oct 24, 2023',
    fileInfo: 'PDF • 1.2 MB',
    status: 'verified',
    canDownload: true,
  },
  {
    id: 'upload-2',
    title: 'Virtual Memory Lab Manual',
    uploadedOn: 'Uploaded on Oct 28, 2023',
    fileInfo: 'DOCX • 850 KB',
    status: 'pending',
    canDownload: false,
  },
  {
    id: 'upload-3',
    title: 'Networking - OSI Model',
    uploadedOn: 'Uploaded on Oct 15, 2023',
    fileInfo: 'PDF • 3.4 MB',
    status: 'rejected',
    canDownload: false,
  },
]

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`
  }
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatUploadDate(date: Date): string {
  return `Uploaded on ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

function normalizePath(pathname: string): RoutePath {
  const isAdminHost = /^admin\./i.test(window.location.hostname)

  if (pathname === '/student_login' || pathname === '/login') {
    return '/student_login'
  }

  if (pathname === '/student_register' || pathname === '/register') {
    return '/student_register'
  }

  if (pathname === '/faculty_login') {
    return '/faculty_login'
  }

  if (pathname === '/admin_login') {
    return '/admin_login'
  }

  if (pathname === '/admin_dashboard') {
    return '/admin_dashboard'
  }

  if (pathname === '/admin_faculty_accounts') {
    return '/admin_faculty_accounts'
  }

  if (pathname === '/admin_assign_subjects') {
    return '/admin_assign_subjects'
  }

  if (pathname === '/admin_student_accounts') {
    return '/admin_student_accounts'
  }

  if (pathname === '/admin_circulars') {
    return '/admin_circulars'
  }

  if (pathname === '/admin_enroll_students') {
    return '/admin_enroll_students'
  }

  if (pathname === '/admin_review_uploads') {
    return '/admin_review_uploads'
  }

  if (pathname === '/admin_student_details') {
    return '/admin_student_details'
  }

  if (pathname === '/admin_faculty_details') {
    return '/admin_faculty_details'
  }

  if (pathname === '/forgot_password' || pathname === '/forgot-password') {
    return '/forgot_password'
  }

  if (pathname === '/reset_password' || pathname === '/reset-password') {
    return '/reset_password'
  }

  if (pathname === '/faculty_dashboard') {
    return '/faculty_dashboard'
  }

  if (pathname === '/faculty_verification') {
    return '/faculty_verification'
  }

  if (pathname === '/faculty_textbook_upload') {
    return '/faculty_textbook_upload'
  }

  if (pathname === '/faculty_create_assignment') {
    return '/faculty_create_assignment'
  }

  if (pathname === '/faculty_assignment_submissions') {
    return '/faculty_assignment_submissions'
  }

  if (pathname === '/faculty_grade_submission') {
    return '/faculty_grade_submission'
  }

  if (pathname === '/student_dashboard' || pathname === '/dashboard') {
    return '/student_dashboard'
  }

  if (pathname === '/search_results' || pathname === '/search') {
    return '/search_results'
  }

  if (pathname === '/repository' || pathname === '/resources') {
    return '/repository'
  }

  if (pathname === '/assignment_review') {
    return '/assignment_review'
  }

  if (pathname === '/assignment_result' || pathname === '/results') {
    return '/assignment_result'
  }

  if (pathname === '/unofficial_notes') {
    return '/unofficial_notes'
  }

  if (isAdminHost) {
    return '/admin_login'
  }

  return '/'
}

function HomeScreen({
  onStudentLogin,
  onFacultyLogin,
}: {
  onStudentLogin: () => void
  onFacultyLogin: () => void
}) {
  return (
    <>
      <main className="auth-card" aria-label="Department Academic Repository login">
        <div className="top-accent" />

        <section className="card-content">
          <div className="logo-shell" aria-hidden="true">
            <span className="material-symbols-outlined icon-school">school</span>
          </div>

          <h1 className="home-title">StudySync</h1>
          <p className="subtitle">Because Knowledge should never <br/> be hard to find!</p>

          <div className="action-group">
            <button type="button" className="login-button" onClick={onStudentLogin}>
              <span className="material-symbols-outlined">person</span>
              <span>Student Login</span>
            </button>

            <button type="button" className="login-button" onClick={onFacultyLogin}>
              <span className="material-symbols-outlined">badge</span>
              <span>Faculty Login</span>
            </button>
          </div>

          <div className="utility-links">
          </div>

        </section>
      </main>

      <footer className="page-footer">
        <p>© 2024 University Digital Repository. All rights reserved.</p>
      </footer>
    </>
  )
}

function StudentLoginScreen({
  onBack,
  onRegister,
  onLogin,
  onForgotPassword,
}: {
  onBack: () => void
  onRegister: () => void
  onLogin: () => void
  onForgotPassword?: () => void
}) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password, 'student')
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-login-card" aria-label="Student login">
        <div className="student-card-content">
          <button type="button" className="back-link" onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </button>

          <div className="student-logo-wrap">
            <div className="student-logo-shell">
              <span className="material-symbols-outlined icon-school">school</span>
            </div>
          </div>

          <div className="student-heading">
            <h1 className="student-title">Student Login</h1>
            <p>Access your academic dashboard</p>
          </div>

          <div className="student-accent" />

          <form className="student-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div className="field-group">
              <label htmlFor="email">Educational Email</label>
              <input
                id="email"
                type="email"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <p className="field-help">Use your official college credentials</p>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="student-register-cta">
            <p>
              Dont have an account?{' '}
              <button type="button" className="inline-link" onClick={onRegister}>
                Register now
              </button>
            </p>
          </div>

          <div className="forgot-wrap">
            <button type="button" className="inline-link" onClick={onForgotPassword}>
              Forgot Password?
            </button>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <p>© 2024 University Digital Repository</p>
      </footer>
    </>
  )
}

function StudentRegisterScreen({ onLogin }: { onLogin: () => void }) {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    usn: '',
    programme: '',
    semester: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!formData.fullName || !formData.usn || !formData.programme || !formData.semester || !formData.email) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      await register({
        fullName: formData.fullName,
        usn: formData.usn,
        programme: formData.programme,
        semester: formData.semester,
        email: formData.email,
        password: formData.password,
      })
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-register-card" aria-label="Student registration">
        <div className="register-header">
          <div className="register-logo-wrap">
            <div className="register-logo-shell">
              <span className="material-symbols-outlined">school</span>
            </div>
          </div>
          <h1 className="register-title">Student Registration</h1>
          <p>Create your academic portal account</p>
        </div>

        <div className="register-accent" />

        <form className="register-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          <div className="field-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="field-group">
            <label htmlFor="usn">USN (Unique Student Number)</label>
            <input
              id="usn"
              name="usn"
              type="text"
              placeholder="e.g. 1US20CS001"
              value={formData.usn}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="register-grid-two">
            <div className="field-group">
              <label htmlFor="programme">Programme</label>
              <select
                id="programme"
                name="programme"
                value={formData.programme}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="">Select Programme</option>
                <option value="Computer Science & Engineering">B.E. / B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MCA">MCA</option>
                <option value="MBA">MBA</option>
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="semester">Semester</label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="">Select</option>
                <option value="1">1st Sem</option>
                <option value="2">2nd Sem</option>
                <option value="3">3rd Sem</option>
                <option value="4">4th Sem</option>
                <option value="5">5th Sem</option>
                <option value="6">6th Sem</option>
                <option value="7">7th Sem</option>
                <option value="8">8th Sem</option>
              </select>
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="registerEmail">Educational Email</label>
            <input
              id="registerEmail"
              name="email"
              type="email"
              placeholder="student@university.edu"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <p className="register-helper">Use your official college email</p>
          </div>

          <div className="register-grid-two register-password-grid">
            <div className="field-group">
              <label htmlFor="createPassword">Create Password</label>
              <div className="password-wrap">
                <input
                  id="createPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="register-actions">
            <button type="submit" className="student-primary-btn" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="register-login-link">
            <p>
              Already have an account?{' '}
              <button type="button" className="inline-link" onClick={onLogin}>
                Login
              </button>
            </p>
          </div>
        </form>
      </main>
    </>
  )
}

function FacultyLoginScreen({ onLogin }: { onLogin: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password, 'faculty')
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-login-card" aria-label="Faculty login">
        <div className="student-card-content">
          <div className="student-logo-wrap">
            <div className="student-logo-shell">
              <span className="material-symbols-outlined icon-faculty">account_balance</span>
            </div>
          </div>

          <div className="student-heading">
            <h1 className="student-title">Faculty Login</h1>
            <p>Authorized Faculty Access Only</p>
          </div>

          <div className="student-accent faculty-accent" />

          <form className="student-form faculty-form" noValidate onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div className="field-group">
              <label htmlFor="facultyEmail">Faculty Email</label>
              <input
                id="facultyEmail"
                name="facultyEmail"
                type="email"
                placeholder="faculty@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="field-group">
              <label htmlFor="facultyPassword">Password</label>
              <div className="password-wrap">
                <input
                  id="facultyPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <p className="field-help">Contact administrator if you do not have credentials.</p>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="forgot-wrap">
            <a href="#">Forgot Password?</a>
          </div>
        </div>
      </main>
    </>
  )
}

function AdminLoginScreen({ onLogin }: { onLogin: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password, 'admin')
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-login-card" aria-label="Admin login">
        <div className="student-card-content">
          <div className="student-logo-wrap">
            <div className="student-logo-shell">
              <span className="material-symbols-outlined icon-faculty">admin_panel_settings</span>
            </div>
          </div>

          <div className="student-heading">
            <h1 className="student-title">Admin Login</h1>
            <p>Global administrative access</p>
          </div>

          <div className="student-accent faculty-accent" />

          <form className="student-form faculty-form" noValidate onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div className="field-group">
              <label htmlFor="adminEmail">Admin Email</label>
              <input
                id="adminEmail"
                name="adminEmail"
                type="email"
                placeholder="admin@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="field-group">
              <label htmlFor="adminPassword">Password</label>
              <div className="password-wrap">
                <input
                  id="adminPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <p className="field-help">Super admin credentials required.</p>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="forgot-wrap">
            <a href="#">Forgot Password?</a>
          </div>
        </div>
      </main>
    </>
  )
}

function AdminHeader({
  active,
  onNavigateDashboard,
  onNavigateFacultyAccounts,
  onNavigateAssignSubjects,
  onNavigateCirculars,
}: {
  active: 'dashboard' | 'faculty' | 'subjects' | 'circulars'
  onNavigateDashboard: () => void
  onNavigateFacultyAccounts: () => void
  onNavigateAssignSubjects: () => void
  onNavigateCirculars: () => void
}) {
  const { user } = useAuth()
  const displayName = user?.name || user?.fullName || 'Admin User'
  const roleText = user?.role ? `${user.role[0].toUpperCase()}${user.role.slice(1)} Access` : 'Super Administrator'
  return (
    <header className="admin-header">
      <div className="admin-container admin-header-row">
        <h1>Admin Dashboard</h1>
        <div className="admin-header-right">
          <button type="button" className="admin-notification-btn" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="admin-user">
            <div>
              <p>{displayName}</p>
              <p>{roleText}</p>
            </div>
            <div>AU</div>
          </div>
        </div>
      </div>
      <div className="admin-header-accent" />
      <div className="admin-container admin-top-nav">
        <button type="button" onClick={onNavigateDashboard} className={active === 'dashboard' ? 'active' : ''}>
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </button>
        <button type="button" onClick={onNavigateFacultyAccounts} className={active === 'faculty' ? 'active' : ''}>
          <span className="material-symbols-outlined">group</span>
          Faculty Accounts
        </button>
        <button type="button" onClick={onNavigateAssignSubjects} className={active === 'subjects' ? 'active' : ''}>
          <span className="material-symbols-outlined">assignment_ind</span>
          Assign Subjects
        </button>
        <button type="button" onClick={onNavigateCirculars} className={active === 'circulars' ? 'active' : ''}>
          <span className="material-symbols-outlined">campaign</span>
          Circulars
        </button>
        <button type="button">
          <span className="material-symbols-outlined">book</span>
          Departments
        </button>
        <button type="button">
          <span className="material-symbols-outlined">settings</span>
          System Settings
        </button>
      </div>
    </header>
  )
}

function AdminFooter() {
  return (
    <footer className="admin-footer admin-container">
      <p>© 2024 University Digital Repository. Global Administrative Control.</p>
      <nav aria-label="Admin footer links">
        <a href="#">System Status</a>
        <a href="#">Privacy Policy</a>
        <a href="#">User Audit Log</a>
      </nav>
    </footer>
  )
}

function AdminDashboardScreen({
  onAddFaculty,
  onAssignSubjects,
  onStudentAccounts,
  onEnrollStudents,
  onCirculars,
  onReviewUploads,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onAddFaculty: () => void
  onAssignSubjects: () => void
  onStudentAccounts: () => void
  onEnrollStudents?: () => void
  onCirculars: () => void
  onReviewUploads: () => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  return (
    <div className="admin-page" aria-label="Global admin dashboard">
      <CommonDashboardHeader
        title="Admin Dashboard"
        subtitle="Super Administrator"
        navItems={[
          { label: 'Dashboard', path: '/admin_dashboard' },
          { label: 'Faculty Accounts', path: '/admin_faculty_accounts' },
          { label: 'Assign Subjects', path: '/admin_assign_subjects' },
          { label: 'Student Accounts', path: '/admin_student_accounts' },
        ]}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="admin-container"
      />

      <main className="admin-container admin-main">
        <section className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <div>
              <p>Total Students</p>
              <h3>12,482</h3>
              <small>
                <span className="material-symbols-outlined">trending_up</span>
                +3.2%
              </small>
            </div>
            <span className="material-symbols-outlined">group</span>
          </article>
          <article className="admin-kpi-card">
            <div>
              <p>Total Faculty</p>
              <h3>845</h3>
              <small>
                <span className="material-symbols-outlined">trending_up</span>
                +1.5%
              </small>
            </div>
            <span className="material-symbols-outlined">badge</span>
          </article>
          <article className="admin-kpi-card">
            <div>
              <p>Total Subjects</p>
              <h3>312</h3>
              <small>Active Curricula</small>
            </div>
            <span className="material-symbols-outlined">library_books</span>
          </article>
          <article className="admin-kpi-card warning">
            <div>
              <p>Pending Verifications</p>
              <h3>58</h3>
              <small>Requires action</small>
            </div>
            <span className="material-symbols-outlined">verified_user</span>
          </article>
        </section>

        <section className="admin-quick-actions">
          <h2>
            <span className="material-symbols-outlined">bolt</span>
            Quick Actions
          </h2>
          <div>
            <button type="button" onClick={onAddFaculty}>
              <span className="material-symbols-outlined">person_add</span>
              Add Faculty
            </button>
            <button type="button" onClick={onAssignSubjects}>
              <span className="material-symbols-outlined">assignment_ind</span>
              Assign Subjects
            </button>
            <button type="button" onClick={onReviewUploads}>
              <span className="material-symbols-outlined">rule</span>
              Review Uploads
            </button>
            <button type="button" onClick={onStudentAccounts}>
              <span className="material-symbols-outlined">school</span>
              Student Accounts
            </button>
            {onEnrollStudents && (
              <button type="button" onClick={onEnrollStudents}>
                <span className="material-symbols-outlined">person_add</span>
                Enroll Students
              </button>
            )}
            <button type="button" onClick={onCirculars}>
              <span className="material-symbols-outlined">campaign</span>
              Manage Circulars
            </button>
          </div>
        </section>

        <section className="admin-content-grid">
          <article className="admin-activity">
            <div className="admin-card-head">
              <h2>
                <span className="material-symbols-outlined">history</span>
                Activity Feed
              </h2>
              <button type="button">View All</button>
            </div>
            <div className="admin-activity-list">
              <div className="admin-activity-item">
                <div className="admin-activity-icon">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div>
                  <div>
                    <h4>New student registered</h4>
                    <span>2 mins ago</span>
                  </div>
                  <p>David Smith (ID: ST2024001) has completed the portal registration.</p>
                </div>
              </div>
              <div className="admin-activity-item">
                <div className="admin-activity-icon blue">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <div>
                    <h4>Notes verified</h4>
                    <span>45 mins ago</span>
                  </div>
                  <p>Dr. Sarah Jenkins verified "Introduction to Quantum Physics" lecture notes.</p>
                </div>
              </div>
              <div className="admin-activity-item">
                <div className="admin-activity-icon amber">
                  <span className="material-symbols-outlined">upload_file</span>
                </div>
                <div>
                  <div>
                    <h4>New Resource Uploaded</h4>
                    <span>2 hours ago</span>
                  </div>
                  <p>Faculty of Engineering uploaded 4 new research papers for verification.</p>
                </div>
              </div>
              <div className="admin-activity-item">
                <div className="admin-activity-icon gray">
                  <span className="material-symbols-outlined">settings</span>
                </div>
                <div>
                  <div>
                    <h4>System backup completed</h4>
                    <span>6 hours ago</span>
                  </div>
                  <p>Weekly system redundancy and security patch successfully deployed.</p>
                </div>
              </div>
            </div>
          </article>

          <aside className="admin-side-cards">
            <article className="admin-storage-card">
              <h3>Storage Usage</h3>
              <div>
                <span />
              </div>
              <p>650 GB of 1 TB used (65%)</p>
              <button type="button">Manage Storage</button>
            </article>

            <article className="admin-support-card">
              <h3>Support Portal</h3>
              <p>
                Having issues with the repository system? Contact technical support or view documentation.
              </p>
              <a href="#">
                Go to Help Center
                <span className="material-symbols-outlined">arrow_forward</span>
              </a>
            </article>
          </aside>
        </section>
      </main>

      <CommonDashboardFooter
        containerClassName="admin-container"
        caption="© 2024 University Digital Repository. Global Administrative Control."
      />
    </div>
  )
}

function AdminCircularsScreen({
  notices,
  onCreateNotice,
  onDeleteNotice,
  onBackDashboard,
  onFacultyAccounts,
  onAssignSubjects,
}: {
  notices: DepartmentNotice[]
  onCreateNotice: (input: { title: string; content: string; urgent: boolean }) => void
  onDeleteNotice: (id: string) => void
  onBackDashboard: () => void
  onFacultyAccounts: () => void
  onAssignSubjects: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [urgent, setUrgent] = useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !content.trim()) {
      return
    }
    onCreateNotice({ title: title.trim(), content: content.trim(), urgent })
    setTitle('')
    setContent('')
    setUrgent(false)
  }

  return (
    <div className="admin-page" aria-label="Department circulars management">
      <AdminHeader
        active="circulars"
        onNavigateDashboard={onBackDashboard}
        onNavigateFacultyAccounts={onFacultyAccounts}
        onNavigateAssignSubjects={onAssignSubjects}
        onNavigateCirculars={() => {}}
      />

      <main className="admin-container admin-main">
        <section className="admin-circulars-head">
          <h2>Department Circulars</h2>
          <p>Create and publish notices for students and faculty.</p>
        </section>

        <section className="admin-circulars-grid">
          <article className="admin-circulars-form-card">
            <h3>Publish Notice</h3>
            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="notice-title">Title</label>
                <input
                  id="notice-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter circular title"
                />
              </div>
              <div className="field-group">
                <label htmlFor="notice-content">Notice Content</label>
                <textarea
                  id="notice-content"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write details for students and faculty..."
                />
              </div>
              <label className="notice-urgent-toggle">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(event) => setUrgent(event.target.checked)}
                />
                <span>Mark as urgent (highlight for students)</span>
              </label>
              <button type="submit">
                <span className="material-symbols-outlined">campaign</span>
                Publish Circular
              </button>
            </form>
          </article>

          <article className="admin-circulars-list-card">
            <div>
              <h3>Recent Notices</h3>
              <p>{notices.length} total</p>
            </div>
            <div className="admin-circulars-list">
              {notices.map((notice) => (
                <article key={notice.id} className={`admin-circular-item ${notice.urgent || isNoticeNew(notice.createdAt) ? 'highlight' : ''}`}>
                  <div>
                    <div>
                      <h4>{notice.title}</h4>
                      <div className="notice-badges">
                        {notice.urgent ? <span className="notice-badge urgent">Urgent</span> : null}
                        {isNoticeNew(notice.createdAt) ? <span className="notice-badge new">New</span> : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="notice-delete-btn"
                      onClick={() => onDeleteNotice(notice.id)}
                      aria-label={`Delete ${notice.title}`}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                  <p>{notice.content}</p>
                  <small>
                    {new Date(notice.createdAt).toLocaleString()} • {notice.author}
                  </small>
                </article>
              ))}
            </div>
          </article>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}

function AdminReviewUploadsScreen({
  onBackDashboard,
  onFacultyAccounts,
  onAssignSubjects,
  onCirculars,
}: {
  onBackDashboard: () => void
  onFacultyAccounts: () => void
  onAssignSubjects: () => void
  onCirculars: () => void
}) {
  const [statusById, setStatusById] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({
    'upload-1': 'pending',
    'upload-2': 'pending',
    'upload-3': 'approved',
  })

  const handleAction = (id: string, status: 'approved' | 'rejected') => {
    setStatusById((current) => ({ ...current, [id]: status }))
  }

  const uploads = [
    { id: 'upload-1', student: 'Aditi Sharma', usn: '1RV21CS001', title: 'OS Unit 3 Notes', format: 'PDF', date: 'Oct 24, 2023' },
    { id: 'upload-2', student: 'Rahul Jayaram', usn: '1RV21IS045', title: 'DBMS Normalization Guide', format: 'DOCX', date: 'Oct 23, 2023' },
    { id: 'upload-3', student: 'Priya Kapoor', usn: '1RV20EC112', title: 'Network Topology Diagrams', format: 'PNG', date: 'Oct 20, 2023' },
  ]

  return (
    <div className="admin-page" aria-label="Admin review uploads">
      <AdminHeader
        active="dashboard"
        onNavigateDashboard={onBackDashboard}
        onNavigateFacultyAccounts={onFacultyAccounts}
        onNavigateAssignSubjects={onAssignSubjects}
        onNavigateCirculars={onCirculars}
      />

      <main className="admin-container admin-main">
        <section className="admin-review-head">
          <h2>Review Uploads</h2>
          <p>HOD/Admin moderation queue for student-contributed resources.</p>
        </section>

        <section className="admin-review-table-card">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>USN</th>
                  <th>Title</th>
                  <th>Format</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => {
                  const status = statusById[upload.id]
                  return (
                    <tr key={upload.id}>
                      <td>{upload.student}</td>
                      <td className="mono">{upload.usn}</td>
                      <td>{upload.title}</td>
                      <td>{upload.format}</td>
                      <td className="muted">{upload.date}</td>
                      <td>
                        <span className={`admin-review-status ${status}`}>{status}</span>
                      </td>
                      <td className="align-right">
                        <div className={`admin-review-actions ${status !== 'pending' ? 'disabled' : ''}`}>
                          <button type="button" className="view">
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button
                            type="button"
                            className="approve"
                            onClick={() => handleAction(upload.id, 'approved')}
                            disabled={status !== 'pending'}
                          >
                            <span className="material-symbols-outlined">check_circle</span>
                          </button>
                          <button
                            type="button"
                            className="reject"
                            onClick={() => handleAction(upload.id, 'rejected')}
                            disabled={status !== 'pending'}
                          >
                            <span className="material-symbols-outlined">block</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}

function AdminStudentAccountsScreen({
  onBackDashboard,
  onFacultyAccounts,
  onAssignSubjects,
  onCirculars,
  onEnrollStudents,
  onViewStudentDetails,
}: {
  onBackDashboard: () => void
  onFacultyAccounts: () => void
  onAssignSubjects: () => void
  onCirculars: () => void
  onEnrollStudents?: () => void
  onViewStudentDetails?: () => void
}) {
  return (
    <div className="admin-page" aria-label="Student accounts management">
      <AdminHeader
        active="dashboard"
        onNavigateDashboard={onBackDashboard}
        onNavigateFacultyAccounts={onFacultyAccounts}
        onNavigateAssignSubjects={onAssignSubjects}
        onNavigateCirculars={onCirculars}
      />

      <main className="admin-container admin-main">
        <section className="admin-students-head">
          <div>
            <nav aria-label="Student account breadcrumbs">
              <span>Dashboard</span>
              <span>/</span>
              <span>Student Accounts</span>
            </nav>
            <h2>Student Accounts Management</h2>
          </div>
          {onEnrollStudents && (
            <button type="button" className="admin-faculty-add-btn" onClick={onEnrollStudents}>
              <span className="material-symbols-outlined">person_add</span>
              Enroll Students
            </button>
          )}
        </section>

        <section className="admin-students-filter-card">
          <div className="admin-students-filter-grid">
            <div className="field-group">
              <label htmlFor="student-search">Search Student</label>
              <div className="admin-students-search">
                <span className="material-symbols-outlined">search</span>
                <input id="student-search" type="text" placeholder="USN or Name..." />
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="student-programme">Programme</label>
              <select id="student-programme" defaultValue="All Programmes">
                <option>All Programmes</option>
                <option>Computer Science &amp; Engineering</option>
                <option>Information Science</option>
                <option>Electronics &amp; Communication</option>
                <option>Mechanical Engineering</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="student-semester">Semester</label>
              <select id="student-semester" defaultValue="All Semesters">
                <option>All Semesters</option>
                <option>1st Semester</option>
                <option>2nd Semester</option>
                <option>3rd Semester</option>
                <option>4th Semester</option>
                <option>5th Semester</option>
                <option>6th Semester</option>
                <option>7th Semester</option>
                <option>8th Semester</option>
              </select>
            </div>
            <div className="admin-students-filter-actions">
              <button type="button" className="apply">
                <span className="material-symbols-outlined">filter_list</span>
                Apply Filters
              </button>
              <button type="button" className="reset" aria-label="Reset filters">
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
            </div>
          </div>
        </section>

        <section className="admin-students-bulk">
          <div>
            <button type="button" className="deactivate">
              <span className="material-symbols-outlined">no_accounts</span>
              Deactivate Selected
            </button>
            <button type="button" className="export">
              <span className="material-symbols-outlined">file_download</span>
              Export CSV
            </button>
          </div>
          <p>
            Showing <span>150</span> student accounts
          </p>
        </section>

        <section className="admin-students-table-card">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="align-center">
                    <input type="checkbox" />
                  </th>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Programme</th>
                  <th>Semester</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="align-center">
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div className="admin-student-person">
                      <span className="blue">AS</span>
                      <p>Aditi Sharma</p>
                    </div>
                  </td>
                  <td className="mono">1RV21CS001</td>
                  <td>Computer Science</td>
                  <td>6th Sem</td>
                  <td className="muted">aditi.s@univ.edu.in</td>
                  <td>
                    <span className="admin-student-status active">Active</span>
                  </td>
                  <td className="align-right">
                    <div className="admin-student-actions">
                      <button type="button" className="view" aria-label="View details" onClick={onViewStudentDetails}>
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button type="button" className="reset" aria-label="Reset password">
                        <span className="material-symbols-outlined">password</span>
                      </button>
                      <button type="button" className="disable" aria-label="Disable account">
                        <span className="material-symbols-outlined">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="align-center">
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div className="admin-student-person">
                      <span className="amber">RJ</span>
                      <p>Rahul Jayaram</p>
                    </div>
                  </td>
                  <td className="mono">1RV21IS045</td>
                  <td>Info. Science</td>
                  <td>4th Sem</td>
                  <td className="muted">rahul.j@univ.edu.in</td>
                  <td>
                    <span className="admin-student-status active">Active</span>
                  </td>
                  <td className="align-right">
                    <div className="admin-student-actions">
                      <button type="button" className="view" aria-label="View details" onClick={onViewStudentDetails}>
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button type="button" className="reset" aria-label="Reset password">
                        <span className="material-symbols-outlined">password</span>
                      </button>
                      <button type="button" className="disable" aria-label="Disable account">
                        <span className="material-symbols-outlined">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="align-center">
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div className="admin-student-person">
                      <span className="gray">PK</span>
                      <p>Priya Kapoor</p>
                    </div>
                  </td>
                  <td className="mono">1RV20EC112</td>
                  <td>Electronics</td>
                  <td>8th Sem</td>
                  <td className="muted">priya.k@univ.edu.in</td>
                  <td>
                    <span className="admin-student-status disabled">Disabled</span>
                  </td>
                  <td className="align-right">
                    <div className="admin-student-actions">
                      <button type="button" className="view" aria-label="View details">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button type="button" className="reset" aria-label="Reset password">
                        <span className="material-symbols-outlined">password</span>
                      </button>
                      <button type="button" className="enable" aria-label="Enable account">
                        <span className="material-symbols-outlined">check_circle</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="admin-students-pagination">
            <p>Showing 1 to 10 of 150 entries</p>
            <div>
              <button type="button" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button type="button" className="active">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <span>...</span>
              <button type="button">15</button>
              <button type="button">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}

function AdminFacultyAccountsScreen({
  onBackDashboard,
  onAssignSubjects,
  onCirculars,
  onViewFacultyDetails,
}: {
  onBackDashboard: () => void
  onAssignSubjects: () => void
  onCirculars: () => void
  onViewFacultyDetails?: () => void
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState('UNIV-8x2K-99LP')

  const generatePassword = () => {
    const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase()
    setTempPassword(`UNIV-${segment()}-${segment()}`)
  }

  return (
    <div className="admin-page" aria-label="Faculty accounts management">
      <AdminHeader
        active="faculty"
        onNavigateDashboard={onBackDashboard}
        onNavigateFacultyAccounts={() => {}}
        onNavigateAssignSubjects={onAssignSubjects}
        onNavigateCirculars={onCirculars}
      />

      <main className="admin-container admin-main">
        <section className="admin-faculty-head">
          <div>
            <h2>Faculty Accounts</h2>
            <div />
          </div>
          <button type="button" className="admin-faculty-add-btn" onClick={() => setIsAddModalOpen(true)}>
            <span className="material-symbols-outlined">person_add</span>
            Add Faculty
          </button>
        </section>

        <section className="admin-faculty-table-card">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Subjects</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="admin-faculty-person">
                      <span>DA</span>
                      <p>Dr. David Anderson</p>
                    </div>
                  </td>
                  <td className="muted">d.anderson@university.edu</td>
                  <td className="muted">Computer Science</td>
                  <td>
                    <span className="admin-faculty-subject-pill">4 Assigned</span>
                  </td>
                  <td>
                    <span className="admin-faculty-status active">Active</span>
                  </td>
                  <td className="align-right">
                    <div className="admin-faculty-actions">
                      <button type="button" aria-label="View faculty details" onClick={onViewFacultyDetails}>
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button type="button" aria-label="Block faculty">
                        <span className="material-symbols-outlined">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="admin-faculty-person">
                      <span>SW</span>
                      <p>Prof. Sarah Wilson</p>
                    </div>
                  </td>
                  <td className="muted">s.wilson@university.edu</td>
                  <td className="muted">Mathematics</td>
                  <td>
                    <span className="admin-faculty-subject-pill">3 Assigned</span>
                  </td>
                  <td>
                    <span className="admin-faculty-status active">Active</span>
                  </td>
                  <td className="align-right">
                    <div className="admin-faculty-actions">
                      <button type="button" aria-label="View faculty details" onClick={onViewFacultyDetails}>
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button type="button" aria-label="Block faculty">
                        <span className="material-symbols-outlined">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="admin-faculty-person">
                      <span>RK</span>
                      <p>Dr. Robert Kovac</p>
                    </div>
                  </td>
                  <td className="muted">r.kovac@university.edu</td>
                  <td className="muted">Physics</td>
                  <td>
                    <span className="admin-faculty-subject-pill">2 Assigned</span>
                  </td>
                  <td>
                    <span className="admin-faculty-status inactive">Inactive</span>
                  </td>
                  <td className="align-right">
                    <div className="admin-faculty-actions">
                      <button type="button" aria-label="Edit faculty">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button type="button" aria-label="Activate faculty">
                        <span className="material-symbols-outlined">check_circle</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="admin-faculty-pagination">
            <p>Showing 1 to 3 of 42 entries</p>
            <div>
              <button type="button" disabled>
                Previous
              </button>
              <button type="button">Next</button>
            </div>
          </div>
        </section>
      </main>

      {isAddModalOpen ? (
        <div className="admin-faculty-modal-backdrop">
          <div className="admin-faculty-modal" role="dialog" aria-modal="true" aria-label="Add new faculty account">
            <div className="admin-faculty-modal-accent" />
            <div className="admin-faculty-modal-content">
              <div className="admin-faculty-modal-head">
                <h3>Add New Faculty Account</h3>
                <button type="button" onClick={() => setIsAddModalOpen(false)} aria-label="Close dialog">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form
                className="admin-faculty-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  setIsAddModalOpen(false)
                }}
              >
                <div className="field-group">
                  <label htmlFor="new-faculty-name">Full Name</label>
                  <input id="new-faculty-name" type="text" placeholder="e.g. Dr. Jane Smith" />
                </div>

                <div className="field-group">
                  <label htmlFor="new-faculty-email">Institutional Email</label>
                  <input id="new-faculty-email" type="email" placeholder="j.smith@university.edu" />
                </div>

                <div className="field-group">
                  <label htmlFor="new-faculty-department">Department</label>
                  <select id="new-faculty-department" defaultValue="">
                    <option value="" disabled>
                      Select Department
                    </option>
                    <option>Computer Science</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Engineering</option>
                  </select>
                </div>

                <div className="admin-faculty-credentials">
                  <p>Security Credentials</p>
                  <div className="admin-faculty-credentials-row">
                    <div>
                      <span>Temporary Password</span>
                      <div>
                        <code>{tempPassword}</code>
                        <button type="button" onClick={generatePassword} aria-label="Regenerate password">
                          <span className="material-symbols-outlined">refresh</span>
                        </button>
                      </div>
                    </div>
                    <label className="admin-faculty-force-change">
                      <input type="checkbox" defaultChecked />
                      <span>Force change</span>
                    </label>
                  </div>
                </div>

                <div className="admin-faculty-modal-actions">
                  <button type="button" className="cancel" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="create">
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <AdminFooter />
    </div>
  )
}

function AdminAssignSubjectsScreen({
  onBackDashboard,
  onFacultyAccounts,
  onCirculars,
}: {
  onBackDashboard: () => void
  onFacultyAccounts: () => void
  onCirculars: () => void
}) {
  const [selectedSubjectCodes, setSelectedSubjectCodes] = useState<string[]>(['CS-401', 'CS-405'])
  const [isAssigned, setIsAssigned] = useState(false)

  const handleAssign = () => {
    setIsAssigned(true)
    setTimeout(() => {
      setIsAssigned(false)
    }, 3000)
  }

  const toggleSubject = (code: string) => {
    setSelectedSubjectCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    )
  }

  const subjects = [
    { code: 'CS-401', name: 'Advanced Algorithms', programme: 'B.Tech CSE', semester: 'Sem IV' },
    { code: 'CS-405', name: 'Machine Learning Fundamentals', programme: 'B.Tech CSE', semester: 'Sem IV' },
    { code: 'CS-402', name: 'Distributed Systems', programme: 'B.Tech CSE', semester: 'Sem IV' },
    { code: 'AI-101', name: 'Introduction to AI', programme: 'M.Tech AI', semester: 'Sem I' },
    { code: 'CS-202', name: 'Operating Systems', programme: 'B.Tech CSE', semester: 'Sem II' },
  ]

  return (
    <div className="admin-page" aria-label="Assign subjects to faculty">
      <AdminHeader
        active="subjects"
        onNavigateDashboard={onBackDashboard}
        onNavigateFacultyAccounts={onFacultyAccounts}
        onNavigateAssignSubjects={() => {}}
        onNavigateCirculars={onCirculars}
      />

      <main className="admin-container admin-main">
        <section className="admin-assign-head">
          <h2>Assign Subjects to Faculty</h2>
          <p>Select a faculty member and map their academic responsibilities.</p>
        </section>

        <section className="admin-assign-layout">
          <article className="admin-assign-faculty-card">
            <label htmlFor="assign-faculty-search">Select Faculty Member</label>
            <div className="admin-assign-search">
              <span className="material-symbols-outlined">search</span>
              <input id="assign-faculty-search" type="text" defaultValue="Dr. Robert Henderson" />
            </div>

            <div className="admin-assign-profile">
              <div>
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div>
                <h3>Dr. Robert Henderson</h3>
                <p>Senior Professor • Computer Science</p>
              </div>
            </div>

            <div className="admin-assign-meta">
              <div>
                <span>Currently Assigned</span>
                <strong>04 Subjects</strong>
              </div>
              <div>
                <span>Workload Status</span>
                <strong>Optimal</strong>
              </div>
            </div>
          </article>

          <article className="admin-assign-subjects-card">
            <div className="admin-assign-toolbar">
              <div>
                <select defaultValue="All Programmes">
                  <option>All Programmes</option>
                  <option>B.Tech CSE</option>
                  <option>M.Tech AI</option>
                  <option>B.Sc Physics</option>
                </select>
                <select defaultValue="Semester 1">
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                  <option>Semester 3</option>
                  <option>Semester 4</option>
                </select>
              </div>
              <p>
                Showing <span>12</span> subjects
              </p>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th />
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Programme</th>
                    <th>Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => {
                    const isSelected = selectedSubjectCodes.includes(subject.code)
                    return (
                      <tr key={subject.code} className={isSelected ? 'admin-assign-row-selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSubject(subject.code)}
                            aria-label={`Select ${subject.name}`}
                          />
                        </td>
                        <td>{subject.code}</td>
                        <td>{subject.name}</td>
                        <td>{subject.programme}</td>
                        <td>{subject.semester}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-assign-actions">
              {isAssigned ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#059669', width: '100%' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>check_circle</span>
                  <p style={{ margin: 0, fontWeight: '600' }}>Subjects Assigned Successfully!</p>
                </div>
              ) : (
                <>
                  <button type="button" onClick={handleAssign}>
                    <span className="material-symbols-outlined">assignment_turned_in</span>
                    Assign Selected Subjects ({selectedSubjectCodes.length})
                  </button>
                  <p>
                    <span className="material-symbols-outlined">info</span>
                    Faculty can manage only assigned subjects.
                  </p>
                </>
              )}
            </div>
          </article>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}

function FacultyDashboardScreen({
  onViewAllVerification,
  onUploadTextbook,
  onCreateAssignment,
  onViewAssignment,
  notices,
  onCreateNotice,
  onDeleteOwnNotice,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onViewAllVerification: () => void
  onUploadTextbook: () => void
  onCreateAssignment: () => void
  onViewAssignment: () => void
  notices: DepartmentNotice[]
  onCreateNotice: (input: { title: string; content: string; urgent: boolean }) => void
  onDeleteOwnNotice: (id: string) => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const { user } = useAuth()
  const displayName = user?.name || user?.fullName || 'Faculty User'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [officialNoteFile, setOfficialNoteFile] = useState<File | null>(null)
  const [officialNoteUploadError, setOfficialNoteUploadError] = useState<string | null>(null)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationContent, setNotificationContent] = useState('')
  const [isUrgentNotification, setIsUrgentNotification] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null)
  const department = user?.department || 'Department'
  const facultyNotices = notices.filter((notice) => notice.authorRole === 'faculty' && notice.author === displayName)

  const handleOfficialNoteFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }
    try {
      enforceSupportedUploadFile(selectedFile, 25 * 1024 * 1024)
      setOfficialNoteFile(selectedFile)
      setOfficialNoteUploadError(null)
    } catch (error) {
      setOfficialNoteFile(null)
      setOfficialNoteUploadError(
        error instanceof FileUploadError
          ? `${error.message}. Allowed: ${SUPPORTED_UPLOAD_LABEL}.`
          : `Invalid file. Allowed: ${SUPPORTED_UPLOAD_LABEL}.`,
      )
    }
  }

  const closeOfficialNoteModal = () => {
    setIsUploadModalOpen(false)
    setOfficialNoteFile(null)
    setOfficialNoteUploadError(null)
  }

  const handleSendNotification = (event: React.FormEvent) => {
    event.preventDefault()
    const title = notificationTitle.trim()
    const content = notificationContent.trim()
    if (!title || !content) {
      setNotificationError('Please provide both a title and message.')
      setNotificationSuccess(null)
      return
    }
    onCreateNotice({ title, content, urgent: isUrgentNotification })
    setNotificationTitle('')
    setNotificationContent('')
    setIsUrgentNotification(false)
    setNotificationError(null)
    setNotificationSuccess('Notification sent to students.')
  }

  return (
    <div className="faculty-page" aria-label="Faculty management dashboard">
      <CommonDashboardHeader
        title="Faculty Dashboard"
        subtitle={department}
        navItems={[
          { label: 'Dashboard', path: '/faculty_dashboard' },
          { label: 'Verification', path: '/faculty_verification' },
          { label: 'Textbooks', path: '/faculty_textbook_upload' },
          { label: 'Assignments', path: '/faculty_assignment_submissions' },
        ]}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="faculty-container"
      />

      <main className="faculty-container faculty-main">
        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">subject</span>
            <h2>Manage Subjects</h2>
          </div>
          <div className="faculty-subject-grid">
            <div className="field-group">
              <label>Programme</label>
              <select defaultValue="B.Tech Computer Science">
                <option>B.Tech Computer Science</option>
                <option>M.Tech Software Engineering</option>
                <option>B.Sc Data Science</option>
              </select>
            </div>
            <div className="field-group">
              <label>Semester</label>
              <select defaultValue="Semester 5">
                <option>Semester 5</option>
                <option>Semester 6</option>
                <option>Semester 7</option>
              </select>
            </div>
            <div className="field-group">
              <label>Subject Code</label>
              <select defaultValue="CS501 - Operating Systems">
                <option>CS501 - Operating Systems</option>
                <option>CS502 - DBMS</option>
                <option>CS503 - Computer Networks</option>
              </select>
            </div>
          </div>
        </section>

        <section className="faculty-grid-top">
          <section className="dashboard-card">
            <div className="faculty-section-head">
              <div className="dashboard-section-title">
                <span className="material-symbols-outlined">description</span>
                <h2>Official Notes</h2>
              </div>
              <button type="button" className="dashboard-upload-btn" onClick={() => setIsUploadModalOpen(true)}>
                <span className="material-symbols-outlined">upload</span>
                Upload New
              </button>
            </div>
            <div className="dashboard-table-wrap faculty-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Unit/Chapter</th>
                    <th>Date Uploaded</th>
                    <th className="align-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Virtual Memory Architecture</td>
                    <td>Unit 4</td>
                    <td className="muted">Oct 12, 2023</td>
                    <td className="align-right">
                      <button type="button" className="faculty-link-btn">
                        Edit
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>Process Scheduling Algorithms</td>
                    <td>Unit 2</td>
                    <td className="muted">Oct 05, 2023</td>
                    <td className="align-right">
                      <button type="button" className="faculty-link-btn">
                        Edit
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="faculty-section-head">
              <div className="dashboard-section-title">
                <span className="material-symbols-outlined">verified_user</span>
                <h2>Verification Panel</h2>
              </div>
              <button type="button" className="faculty-outline-btn" onClick={onViewAllVerification}>
                View All
              </button>
            </div>
            <p className="faculty-subtitle">Pending Student Notes</p>
            <div className="faculty-verify-list">
              <article className="faculty-verify-card">
                <div className="faculty-verify-top">
                  <div>
                    <h3>James Wilson</h3>
                    <p>2GI21CS045</p>
                  </div>
                  <span className="faculty-new-tag">NEW</span>
                </div>
                <p className="faculty-note-title">"Simplified Notes on Semaphores"</p>
                <div className="faculty-verify-actions">
                  <button type="button" className="faculty-approve-btn">
                    Approve
                  </button>
                  <button type="button" className="faculty-reject-btn">
                    Reject
                  </button>
                </div>
              </article>

              <article className="faculty-verify-card">
                <div className="faculty-verify-top">
                  <div>
                    <h3>Amara Okafor</h3>
                    <p>2GI21CS012</p>
                  </div>
                </div>
                <p className="faculty-note-title">"Shell Scripting Guide.pdf"</p>
                <div className="faculty-verify-actions">
                  <button type="button" className="faculty-approve-btn">
                    Approve
                  </button>
                  <button type="button" className="faculty-reject-btn">
                    Reject
                  </button>
                </div>
              </article>
            </div>
          </section>
        </section>

        <section className="faculty-grid-bottom">
          <section className="dashboard-card">
            <div className="faculty-section-head">
              <div className="dashboard-section-title">
                <span className="material-symbols-outlined">library_books</span>
                <h2>Textbook Management</h2>
              </div>
              <button type="button" className="faculty-outline-btn" onClick={onUploadTextbook}>
                <span className="material-symbols-outlined">add</span>
                Upload
              </button>
            </div>
            <div className="faculty-item-list">
              <div className="faculty-item-row">
                <div>
                  <h3>Operating System Concepts</h3>
                  <p>Silberschatz • 10th Ed</p>
                </div>
                <button type="button" className="faculty-icon-danger">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
              <div className="faculty-item-row">
                <div>
                  <h3>Modern Operating Systems</h3>
                  <p>Andrew Tanenbaum • 4th Ed</p>
                </div>
                <button type="button" className="faculty-icon-danger">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="faculty-section-head">
              <div className="dashboard-section-title">
                <span className="material-symbols-outlined">assignment_turned_in</span>
                <h2>Active Assignments</h2>
              </div>
              <button type="button" className="dashboard-btn-primary dashboard-btn-small" onClick={onCreateAssignment}>
                Create New
              </button>
            </div>
            <div className="faculty-item-list">
              <div className="faculty-item-row faculty-assignment-row">
                <div>
                  <h3>Multi-threaded Scheduler</h3>
                  <p>42 Submissions • Due: 3 Days</p>
                </div>
                <button type="button" className="faculty-view-btn" onClick={onViewAssignment}>
                  View
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div className="faculty-item-row faculty-assignment-row">
                <div>
                  <h3>Disk Management Quiz</h3>
                  <p>128 Submissions • Closed</p>
                </div>
                <button type="button" className="faculty-view-btn" onClick={onViewAssignment}>
                  View
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </section>
        </section>

        <section className="dashboard-card faculty-notification-card">
          <div className="faculty-section-head">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">campaign</span>
              <h2>Department Notifications</h2>
            </div>
          </div>

          <form className="faculty-notification-form" onSubmit={handleSendNotification}>
            <div className="field-group">
              <label htmlFor="faculty-notification-title">Title</label>
              <input
                id="faculty-notification-title"
                type="text"
                value={notificationTitle}
                onChange={(event) => setNotificationTitle(event.target.value)}
                placeholder="Exam update, class change, deadline reminder..."
              />
            </div>

            <div className="field-group">
              <label htmlFor="faculty-notification-content">Message</label>
              <textarea
                id="faculty-notification-content"
                rows={4}
                value={notificationContent}
                onChange={(event) => setNotificationContent(event.target.value)}
                placeholder="Write the department circular/notification for students..."
              />
            </div>
            <label className="notice-urgent-toggle">
              <input
                type="checkbox"
                checked={isUrgentNotification}
                onChange={(event) => setIsUrgentNotification(event.target.checked)}
              />
              <span>Mark as urgent notice</span>
            </label>

            <div className="faculty-notification-actions">
              <button type="submit" className="dashboard-btn-primary">
                <span className="material-symbols-outlined">send</span>
                Send Notification
              </button>
              <p>This appears in the non-clickable notification block on the student dashboard.</p>
            </div>
            {notificationError ? <p className="faculty-notification-error">{notificationError}</p> : null}
            {notificationSuccess ? <p className="faculty-notification-success">{notificationSuccess}</p> : null}
          </form>

          <div className="faculty-notification-history">
            <h3>Recent Sent</h3>
            {facultyNotices.length === 0 ? (
              <p className="faculty-notification-empty">No notifications sent yet.</p>
            ) : null}
            {facultyNotices.slice(0, 5).map((notice) => (
              <article key={notice.id} className={`faculty-notification-item ${notice.urgent || isNoticeNew(notice.createdAt) ? 'highlight' : ''}`}>
                <div>
                  <div>
                    <h4>{notice.title}</h4>
                    <div className="notice-badges">
                      {notice.urgent ? <span className="notice-badge urgent">Urgent</span> : null}
                      {isNoticeNew(notice.createdAt) ? <span className="notice-badge new">New</span> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="notice-delete-btn"
                    onClick={() => onDeleteOwnNotice(notice.id)}
                    aria-label={`Delete ${notice.title}`}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <p>{notice.content}</p>
                <small>{new Date(notice.createdAt).toLocaleString()}</small>
              </article>
            ))}
          </div>
        </section>
      </main>

      {isUploadModalOpen ? (
        <div className="faculty-modal-overlay" role="dialog" aria-modal="true" aria-label="Upload official notes">
          <div className="faculty-modal-card">
            <div className="faculty-modal-head">
              <div className="faculty-modal-title-wrap">
                <div className="faculty-modal-icon">
                  <span className="material-symbols-outlined">upload_file</span>
                </div>
                <h2>Upload Official Notes</h2>
              </div>
              <button
                type="button"
                className="faculty-modal-close"
                aria-label="Close upload modal"
                onClick={closeOfficialNoteModal}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              className="faculty-modal-form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!officialNoteFile) {
                  setOfficialNoteUploadError(`Please choose a file. Allowed: ${SUPPORTED_UPLOAD_LABEL}.`)
                  return
                }
                closeOfficialNoteModal()
              }}
            >
              <div className="faculty-modal-field">
                <label>
                  <span>1</span>
                  Subject
                </label>
                <input type="text" value="CS501 - Operating Systems" disabled />
              </div>

              <div className="faculty-modal-field">
                <label>
                  <span>2</span>
                  Unit / Chapter
                </label>
                <select defaultValue="">
                  <option disabled value="">
                    Select Unit/Chapter
                  </option>
                  <option>Unit 1: Introduction to OS</option>
                  <option>Unit 2: Process Management</option>
                  <option>Unit 3: Memory Management</option>
                  <option>Unit 4: Storage Management</option>
                  <option>Unit 5: Protection and Security</option>
                </select>
              </div>

              <div className="faculty-modal-field">
                <label>
                  <span>3</span>
                  Note Title
                </label>
                <input type="text" placeholder="e.g., Detailed Guide on Paging & Segmentation" />
              </div>

              <div className="faculty-modal-field">
                <label>
                  <span>4</span>
                  Description <em>(Optional)</em>
                </label>
                <textarea rows={3} placeholder="Provide a brief overview of the contents..." />
              </div>

              <div className="faculty-modal-field">
                <label>
                  <span>5</span>
                  Upload File
                </label>
                <label className="faculty-upload-dropzone">
                  <input type="file" accept={SUPPORTED_UPLOAD_ACCEPT} onChange={handleOfficialNoteFileChange} />
                  <div>
                    <span className="material-symbols-outlined">cloud_upload</span>
                  </div>
                  <p>Click to upload or drag and drop</p>
                  <p>{SUPPORTED_UPLOAD_LABEL} (Max 25MB)</p>
                  {officialNoteFile ? (
                    <p style={{ marginTop: '0.375rem', color: '#059669', fontWeight: 600 }}>
                      Selected: {officialNoteFile.name}
                    </p>
                  ) : null}
                  {officialNoteUploadError ? (
                    <p style={{ marginTop: '0.375rem', color: '#b91c1c', fontWeight: 600 }}>
                      {officialNoteUploadError}
                    </p>
                  ) : null}
                </label>
              </div>

              <div className="faculty-modal-submit-wrap">
                <button type="submit" className="faculty-modal-submit">
                  Publish Notes
                </button>
                <div>
                  <span className="material-symbols-outlined">info</span>
                  <p>These notes will immediately appear under Official Notes for students.</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <CommonDashboardFooter
        containerClassName="faculty-container"
        caption="University Digital Repository • Faculty Portal"
      />
    </div>
  )
}

function StudentDashboardScreen({
  onViewBrief,
  onViewResult,
  onUnofficialNotes,
  onSearchResources,
  onBrowseRepository,
  notices,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onViewBrief: () => void
  onViewResult: () => void
  onUnofficialNotes: () => void
  onSearchResources: () => void
  onBrowseRepository: () => void
  notices: DepartmentNotice[]
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const { user } = useAuth()
  const semester = user?.semester ? `Semester ${user.semester}` : 'Semester'
  const programme = user?.programme || 'Programme'
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('Document.pdf')

  return (
    <div className="dashboard-page" aria-label="Student dashboard">
      <CommonDashboardHeader
        title="Student Dashboard"
        subtitle={`${semester} • ${programme}`}
        navItems={[
          { label: 'Dashboard', path: '/student_dashboard' },
          { label: 'Repository', path: '/repository' },
          { label: 'Search', path: '/search_results' },
          { label: 'Unofficial Notes', path: '/unofficial_notes' },
        ]}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="dashboard-container"
      />

      <main className="dashboard-container dashboard-main">
        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">notifications</span>
            <h2>Department Circulars</h2>
          </div>

          <div className="student-notification-list" aria-live="polite">
            {notices.slice(0, 4).map((notice) => (
              <article key={notice.id} className={`student-notification-item ${notice.urgent || isNoticeNew(notice.createdAt) ? 'highlight' : ''}`}>
                <div className="student-notification-head">
                  <h3>{notice.title}</h3>
                  <div className="notice-badges">
                    {notice.urgent ? <span className="notice-badge urgent">Urgent</span> : null}
                    {isNoticeNew(notice.createdAt) ? <span className="notice-badge new">New</span> : null}
                  </div>
                </div>
                <p>{notice.content}</p>
                <small>
                  {new Date(notice.createdAt).toLocaleString()} • {notice.author}
                </small>
              </article>
            ))}
          </div>
          <p className="student-notification-note">Informational only. Circulars are not clickable.</p>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">filter_alt</span>
            <h2>Select Subject</h2>
          </div>

          <div className="dashboard-filter-grid">
            <div className="field-group">
              <label>Course</label>
              <div className="dashboard-static-field">B.Tech Computer Science</div>
            </div>

            <div className="field-group">
              <label>Semester</label>
              <div className="dashboard-static-field">Semester 5</div>
            </div>

            <div className="field-group">
              <label htmlFor="subject">Subject Code</label>
              <select id="subject" defaultValue="CS501 - Operating Systems">
                <option>CS501 - Operating Systems</option>
                <option>CS502 - Database Management</option>
                <option>CS503 - Computer Networks</option>
              </select>
            </div>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-notes-header">
            <div className="dashboard-tabs" role="tablist" aria-label="Notes type">
              <button type="button" className="dashboard-tab dashboard-tab-active">
                Official Notes
              </button>
              <button type="button" className="dashboard-tab" onClick={onUnofficialNotes}>
                Unofficial Notes
              </button>
            </div>

            <div className="dashboard-top-actions">
              <button type="button" className="dashboard-upload-btn" onClick={onSearchResources}>
                <span className="material-symbols-outlined">search</span>
                Search Repository
              </button>
              <button type="button" className="dashboard-btn-secondary dashboard-btn-small" onClick={onBrowseRepository}>
                <span className="material-symbols-outlined">folder_open</span>
                Browse Repository
              </button>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Chapter</th>
                  <th>Faculty / Author</th>
                  <th>Date</th>
                  <th className="notes-action-col">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Memory Management Overview</td>
                  <td>Chapter 4</td>
                  <td className="muted">Dr. Robert Wilson</td>
                  <td className="muted">Oct 12, 2023</td>
                  <td className="notes-action-col">
                    <div className="dashboard-action-icons">
                      <button
                        type="button"
                        className="dashboard-table-icon-btn"
                        aria-label="View note"
                        onClick={() => {
                          setPreviewTitle('Memory Management Overview.pdf')
                          setIsPreviewOpen(true)
                        }}
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button type="button" className="dashboard-table-icon-btn" aria-label="Download note">
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Process Synchronization</td>
                  <td>Chapter 3</td>
                  <td className="muted">Dr. Robert Wilson</td>
                  <td className="muted">Oct 05, 2023</td>
                  <td className="notes-action-col">
                    <div className="dashboard-action-icons">
                      <button
                        type="button"
                        className="dashboard-table-icon-btn"
                        aria-label="View note"
                        onClick={() => {
                          setPreviewTitle('Process Synchronization.pdf')
                          setIsPreviewOpen(true)
                        }}
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button type="button" className="dashboard-table-icon-btn" aria-label="Download note">
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">menu_book</span>
            <h2>Recommended Textbooks</h2>
          </div>

          <div className="dashboard-textbooks-grid">
            <article className="dashboard-item-row">
              <div>
                <h3>Operating System Concepts</h3>
                <p>Silberschatz, Galvin, Gagne • 10th Edition</p>
              </div>
              <button type="button" className="dashboard-icon-btn" aria-label="Download Operating System Concepts">
                <span className="material-symbols-outlined">download</span>
              </button>
            </article>

            <article className="dashboard-item-row">
              <div>
                <h3>Modern Operating Systems</h3>
                <p>Andrew S. Tanenbaum • 4th Edition</p>
              </div>
              <button type="button" className="dashboard-icon-btn" aria-label="Download Modern Operating Systems">
                <span className="material-symbols-outlined">download</span>
              </button>
            </article>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">assignment</span>
            <h2>Recent Assignments</h2>
          </div>

          <div className="dashboard-assignment-list">
            <article className="dashboard-assignment-row">
              <div className="dashboard-assignment-left">
                <div className="dashboard-assignment-icon warning">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div className="dashboard-assignment-content">
                  <h3>Implement Multi-threaded Scheduler</h3>
                  <p>Subject: CS501 • 15th Nov 2023</p>
                </div>
              </div>
              <div className="dashboard-assignment-right">
                <div className="dashboard-assignment-meta">
                  <p className="status-warning-text">Due in 2 Days</p>
                  <span className="pill">Not Submitted</span>
                </div>
                <button type="button" className="dashboard-btn-primary dashboard-btn-small dashboard-assignment-action" onClick={onViewBrief}>
                  View Brief
                </button>
              </div>
            </article>

            <article className="dashboard-assignment-row">
              <div className="dashboard-assignment-left">
                <div className="dashboard-assignment-icon info">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div className="dashboard-assignment-content">
                  <h3>Memory Mapping Lab Report</h3>
                  <p>Subject: CS501 • 01st Nov 2023</p>
                </div>
              </div>
              <div className="dashboard-assignment-right">
                <div className="dashboard-assignment-meta">
                  <p className="status-success-text">Completed</p>
                  <span className="pill success">Submitted</span>
                </div>
                <button type="button" className="dashboard-btn-secondary dashboard-btn-small dashboard-assignment-action" onClick={onViewResult}>
                  View Result
                </button>
              </div>
            </article>

            <article className="dashboard-assignment-row">
              <div className="dashboard-assignment-left">
                <div className="dashboard-assignment-icon success">
                  <span className="material-symbols-outlined">grade</span>
                </div>
                <div className="dashboard-assignment-content">
                  <h3>CPU Scheduling Quiz</h3>
                  <p>Subject: CS501 • 25th Oct 2023</p>
                </div>
              </div>
              <div className="dashboard-assignment-right">
                <div className="dashboard-assignment-meta">
                  <p className="grade-text">Grade: A+</p>
                  <span className="pill info">Graded</span>
                </div>
                <button type="button" className="dashboard-btn-secondary dashboard-btn-small dashboard-assignment-action" onClick={onViewResult}>
                  Details
                </button>
              </div>
            </article>
          </div>
        </section>
      </main>

      <CommonDashboardFooter
        containerClassName="dashboard-container"
        caption="© 2024 University Academic Digital Repository"
      />
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        title={previewTitle}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}

function FacultyVerificationScreen({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [verifiedNotes, setVerifiedNotes] = useState<Set<string>>(new Set())
  const [rejectedNotes, setRejectedNotes] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('Document.pdf')

  const handleApprove = async (noteId: string) => {
    setIsLoading((prev) => ({ ...prev, [noteId]: true }))
    try {
      await facultyService.verifyNote(noteId, 'approve')
      setVerifiedNotes((prev) => new Set([...prev, noteId]))
      setRejectedNotes((prev) => {
        const next = new Set(prev)
        next.delete(noteId)
        return next
      })
    } catch (error) {
      console.error('Failed to approve note:', error)
    } finally {
      setIsLoading((prev) => ({ ...prev, [noteId]: false }))
    }
  }

  const handleReject = async (noteId: string) => {
    setIsLoading((prev) => ({ ...prev, [noteId]: true }))
    try {
      await facultyService.verifyNote(noteId, 'reject')
      setRejectedNotes((prev) => new Set([...prev, noteId]))
      setVerifiedNotes((prev) => {
        const next = new Set(prev)
        next.delete(noteId)
        return next
      })
    } catch (error) {
      console.error('Failed to reject note:', error)
    } finally {
      setIsLoading((prev) => ({ ...prev, [noteId]: false }))
    }
  }

  const getStatus = (noteId: string) => {
    if (verifiedNotes.has(noteId)) return 'verified'
    if (rejectedNotes.has(noteId)) return 'rejected'
    return 'pending'
  }

  return (
    <div className="faculty-page" aria-label="Student notes verification panel">
      <CommonDashboardHeader
        title="Faculty Verification"
        subtitle="Verification Panel"
        navItems={[
          { label: 'Dashboard', path: '/faculty_dashboard' },
          { label: 'Verification', path: '/faculty_verification' },
          { label: 'Textbooks', path: '/faculty_textbook_upload' },
          { label: 'Assignments', path: '/faculty_assignment_submissions' },
        ]}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="faculty-container"
      />

      <main className="faculty-container faculty-main">
        <div className="faculty-verify-page-title">
          <h2>Student Notes Verification</h2>
          <div />
        </div>

        <section className="faculty-verify-filters">
          <div className="faculty-verify-search">
            <span className="material-symbols-outlined">search</span>
            <input type="text" placeholder="Search Student Name or USN..." />
          </div>
          <select defaultValue="">
            <option value="">All Chapters</option>
            <option>Unit 1: Introduction</option>
            <option>Unit 2: Process Mgmt</option>
            <option>Unit 3: Memory Mgmt</option>
          </select>
          <select defaultValue="">
            <option value="">All Status</option>
            <option>Pending</option>
            <option>Verified</option>
            <option>Rejected</option>
          </select>
          <button type="button" className="faculty-filter-btn">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </section>

        <section className="dashboard-card faculty-verify-table-card">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Note Title</th>
                  <th>Chapter</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Aditya Kulkarni</td>
                  <td className="muted">1MS21CS004</td>
                  <td>
                    <div className="faculty-note-cell">
                      <span>Virtual Memory Deep Dive</span>
                      <span className="faculty-new-tag">NEW</span>
                    </div>
                  </td>
                  <td className="muted">Unit 3</td>
                  <td className="muted">Oct 24, 2023</td>
                  <td>
                    <span className={`faculty-status-badge ${getStatus('note-1')}`}>
                      {getStatus('note-1') === 'verified' ? 'Verified' : getStatus('note-1') === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td className="align-right">
                    <div className={`faculty-row-actions ${getStatus('note-1') !== 'pending' ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="faculty-preview-btn"
                        disabled={getStatus('note-1') !== 'pending'}
                        onClick={() => {
                          setPreviewTitle('Virtual Memory Deep Dive.pdf')
                          setIsPreviewOpen(true)
                        }}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className="faculty-approve-btn"
                        onClick={() => handleApprove('note-1')}
                        disabled={getStatus('note-1') !== 'pending' || isLoading['note-1']}
                      >
                        {isLoading['note-1'] ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="faculty-reject-btn"
                        onClick={() => handleReject('note-1')}
                        disabled={getStatus('note-1') !== 'pending' || isLoading['note-1']}
                      >
                        {isLoading['note-1'] ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Rohan Sharma</td>
                  <td className="muted">1MS21CS142</td>
                  <td>
                    <div className="faculty-note-cell">
                      <span>Process Scheduling Algos</span>
                      <span className="faculty-new-tag">NEW</span>
                    </div>
                  </td>
                  <td className="muted">Unit 2</td>
                  <td className="muted">Oct 23, 2023</td>
                  <td>
                    <span className={`faculty-status-badge ${getStatus('note-2')}`}>
                      {getStatus('note-2') === 'verified' ? 'Verified' : getStatus('note-2') === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td className="align-right">
                    <div className={`faculty-row-actions ${getStatus('note-2') !== 'pending' ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="faculty-preview-btn"
                        disabled={getStatus('note-2') !== 'pending'}
                        onClick={() => {
                          setPreviewTitle('Process Scheduling Algos.pdf')
                          setIsPreviewOpen(true)
                        }}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className="faculty-approve-btn"
                        onClick={() => handleApprove('note-2')}
                        disabled={getStatus('note-2') !== 'pending' || isLoading['note-2']}
                      >
                        {isLoading['note-2'] ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="faculty-reject-btn"
                        onClick={() => handleReject('note-2')}
                        disabled={getStatus('note-2') !== 'pending' || isLoading['note-2']}
                      >
                        {isLoading['note-2'] ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Ananya Iyer</td>
                  <td className="muted">1MS21CS028</td>
                  <td>Deadlock Prevention Strategies</td>
                  <td className="muted">Unit 2</td>
                  <td className="muted">Oct 20, 2023</td>
                  <td>
                    <span className="faculty-status-badge verified">Verified</span>
                  </td>
                  <td className="align-right">
                    <div className="faculty-row-actions disabled">
                      <button type="button" className="faculty-preview-btn" disabled>
                        Preview
                      </button>
                      <button type="button" className="faculty-approve-btn" disabled>
                        Approve
                      </button>
                      <button type="button" className="faculty-reject-btn" disabled>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Vikram Rao</td>
                  <td className="muted">1MS21CS189</td>
                  <td>History of Computing Systems</td>
                  <td className="muted">Unit 1</td>
                  <td className="muted">Oct 18, 2023</td>
                  <td>
                    <span className="faculty-status-badge rejected">Rejected</span>
                  </td>
                  <td className="align-right">
                    <div className="faculty-row-actions disabled">
                      <button type="button" className="faculty-preview-btn" disabled>
                        Preview
                      </button>
                      <button type="button" className="faculty-approve-btn" disabled>
                        Approve
                      </button>
                      <button type="button" className="faculty-reject-btn" disabled>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="faculty-pagination">
            <p>Showing 1 to 4 of 24 submissions</p>
            <div>
              <button type="button" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button type="button" className="active">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer faculty-container">
        <div>
          <p>University Digital Repository • Faculty Portal</p>
        </div>
        <nav aria-label="Footer links">
          <a href="#">Internal Guidelines</a>
          <a href="#">Faculty Support</a>
          <a href="#">System Status</a>
        </nav>
      </footer>
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        title={previewTitle}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}

function FacultyTextbookUploadScreen({
  currentPath,
  onNavigate,
  onLogout,
}: {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    edition: '',
    subjectId: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      try {
        enforceSupportedUploadFile(selectedFile, 50 * 1024 * 1024)
        setFile(selectedFile)
        setError(null)
      } catch (err) {
        setError(err instanceof FileUploadError ? err.message : 'Invalid file')
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!formData.title || !formData.author || !file) {
      setError('Please fill in all required fields and select a file')
      return
    }

    setIsLoading(true)

    try {
      await facultyService.uploadTextbook({
        file,
        title: formData.title,
        author: formData.author,
        edition: formData.edition,
        subjectId: formData.subjectId || undefined,
      })
      setIsModalOpen(false)
      setFormData({ title: '', author: '', edition: '', subjectId: '' })
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="textbook-page" aria-label="Textbook management panel">
      {isModalOpen ? <div className="textbook-modal-overlay" /> : null}

      <CommonDashboardHeader
        title="Faculty Textbooks"
        subtitle="Textbook Management"
        navItems={[
          { label: 'Dashboard', path: '/faculty_dashboard' },
          { label: 'Verification', path: '/faculty_verification' },
          { label: 'Textbooks', path: '/faculty_textbook_upload' },
          { label: 'Assignments', path: '/faculty_assignment_submissions' },
        ]}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="faculty-container"
      />

      <main className="faculty-container textbook-main">
        <div className="textbook-title-row">
          <div>
            <h2>Textbook Management</h2>
            <div />
          </div>
          <button type="button" className="textbook-upload-btn" onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined">upload_file</span>
            Upload Textbook
          </button>
        </div>

        <section className="textbook-list-card">
          <div className="textbook-list-head">
            <div>Book Details</div>
            <div>Author &amp; Edition</div>
            <div>Upload Date</div>
            <div className="align-right">Action</div>
          </div>
          <div className="textbook-list-body">
            <article className="textbook-list-row">
              <div className="textbook-book-cell">
                <div className="textbook-icon-cell">
                  <span className="material-symbols-outlined">book_2</span>
                </div>
                <div>
                  <h3>Modern Operating Systems</h3>
                  <p>ISBN: 978-0133591620</p>
                </div>
              </div>
              <div>
                <p>Andrew S. Tanenbaum</p>
                <p>4th Edition</p>
              </div>
              <div>
                <p>Oct 24, 2023</p>
              </div>
              <div className="align-right">
                <button type="button" className="faculty-icon-danger">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </article>

            <article className="textbook-list-row">
              <div className="textbook-book-cell">
                <div className="textbook-icon-cell">
                  <span className="material-symbols-outlined">book_2</span>
                </div>
                <div>
                  <h3>Introduction to Algorithms</h3>
                  <p>ISBN: 978-0262033848</p>
                </div>
              </div>
              <div>
                <p>Thomas H. Cormen</p>
                <p>3rd Edition</p>
              </div>
              <div>
                <p>Oct 15, 2023</p>
              </div>
              <div className="align-right">
                <button type="button" className="faculty-icon-danger">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </article>
          </div>
        </section>

        <div className="textbook-sync-note">
          <span className="material-symbols-outlined">sync</span>
          <p>All uploaded books are automatically synced to the student dashboard.</p>
        </div>
      </main>

      {isModalOpen ? (
        <div className="textbook-modal-wrap" role="dialog" aria-modal="true" aria-label="Upload new textbook">
          <div className="textbook-modal-card">
            <div className="textbook-modal-head">
              <div>
                <h3>Upload New Textbook</h3>
                <p>Fill in the details to add a new resource to the repository.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="textbook-modal-form" onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="book-title">Book Title</label>
                <input
                  id="book-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Modern Operating Systems"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="textbook-modal-grid">
                <div>
                  <label htmlFor="author">Author Name</label>
                  <input
                    id="author"
                    name="author"
                    type="text"
                    placeholder="e.g. Andrew S. Tanenbaum"
                    value={formData.author}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="edition">
                    Edition <span className="field-optional">(Optional)</span>
                  </label>
                  <select
                    id="edition"
                    name="edition"
                    value={formData.edition}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="">Select Edition</option>
                    <option value="1st">1st Edition</option>
                    <option value="2nd">2nd Edition</option>
                    <option value="3rd">3rd Edition</option>
                    <option value="4th">4th Edition</option>
                    <option value="5th+">5th Edition or newer</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Book Document</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={SUPPORTED_UPLOAD_ACCEPT}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <label
                  className="textbook-file-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                  <p>Click or drag file to upload</p>
                  {file && <p style={{ color: '#059669', fontWeight: '600' }}>{file.name} ({formatFileSize(file.size)})</p>}
                  <p>Files will be encrypted and stored securely</p>
                </label>
                <p className="textbook-file-help">Maximum file size: 50MB. Supported: {SUPPORTED_UPLOAD_LABEL}.</p>
              </div>
              <div className="textbook-modal-actions">
                <button type="submit" className="textbook-publish-btn" disabled={isLoading || !file}>
                  {isLoading ? 'Uploading...' : 'Upload &amp; Publish'}
                </button>
                <button type="button" className="textbook-cancel-btn" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <footer className="dashboard-footer faculty-container">
        <div>
          <p>University Digital Repository • Faculty Portal</p>
        </div>
        <nav aria-label="Footer links">
          <a href="#">Internal Guidelines</a>
          <a href="#">Faculty Support</a>
          <a href="#">System Status</a>
        </nav>
      </footer>
    </div>
  )
}

function FacultyCreateAssignmentScreen({
  onBackToDashboard,
}: {
  onBackToDashboard?: () => void
}) {
  const [isCreated, setIsCreated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    instructions: '',
    totalMarks: '',
    dueDate: '',
    allowLateSubmission: false,
  })
  const [resourceFiles, setResourceFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      try {
        newFiles.forEach((file) => {
          enforceSupportedUploadFile(file, 50 * 1024 * 1024)
        })
        setResourceFiles((prev) => [...prev, ...newFiles])
        setError(null)
      } catch (err) {
        setError(err instanceof FileUploadError ? err.message : 'Invalid file')
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!formData.title || !formData.subjectId || !formData.instructions || !formData.totalMarks || !formData.dueDate) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      await assignmentService.createAssignment({
        title: formData.title,
        subjectId: formData.subjectId,
        instructions: formData.instructions,
        totalMarks: parseInt(formData.totalMarks),
        dueDate: formData.dueDate,
        allowLateSubmission: formData.allowLateSubmission,
        resources: resourceFiles,
      })
      setIsCreated(true)
      setTimeout(() => {
        if (onBackToDashboard) {
          onBackToDashboard()
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="create-assignment-page" aria-label="Create assignment">
      <header className="create-assignment-header">
        <div className="create-assignment-container create-assignment-header-row">
          <div className="create-assignment-brand">
            <div className="create-assignment-brand-icon">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h1>UniRepo</h1>
          </div>
          <nav className="create-assignment-nav">
            <button type="button" onClick={onBackToDashboard} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}>
              Dashboard
            </button>
            <a href="#" className="active">
              Assignments
            </a>
            <a href="#">Subjects</a>
            <a href="#">Resources</a>
          </nav>
          <div className="create-assignment-header-right">
            <button type="button" className="create-assignment-notify">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="dashboard-avatar">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
          </div>
        </div>
      </header>

      <main className="create-assignment-main">
        <div className="create-assignment-title">
          <h2>Create Assignment</h2>
          <div />
        </div>

        <form className="create-assignment-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          <section className="create-assignment-card">
            <div className="create-assignment-section-title">
              <span className="material-symbols-outlined">info</span>
              <h3>General Info</h3>
            </div>
            <div className="create-assignment-fields">
              <div>
                <label htmlFor="assignment-title">Assignment Title</label>
                <input
                  id="assignment-title"
                  name="title"
                  type="text"
                  placeholder="e.g., Introduction to Algorithms"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="assignment-instructions">Instructions</label>
                <textarea
                  id="assignment-instructions"
                  name="instructions"
                  rows={6}
                  placeholder="Provide detailed steps for students..."
                  value={formData.instructions}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </section>

          <section className="create-assignment-card">
            <div className="create-assignment-section-title">
              <span className="material-symbols-outlined">calendar_today</span>
              <h3>Grading &amp; Timeline</h3>
            </div>
            <div className="create-assignment-grid">
              <div>
                <label htmlFor="assignment-marks">Total Marks</label>
                <div className="create-assignment-marks-wrap">
                  <input
                    id="assignment-marks"
                    name="totalMarks"
                    type="number"
                    placeholder="100"
                    value={formData.totalMarks}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                  <span>pts</span>
                </div>
              </div>
              <div>
                <label htmlFor="assignment-due">Due Date &amp; Time</label>
                <input
                  id="assignment-due"
                  name="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </section>

          <section className="create-assignment-card">
            <div className="create-assignment-section-title">
              <span className="material-symbols-outlined">attach_file</span>
              <h3>Resources</h3>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_UPLOAD_ACCEPT}
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label
              className="create-assignment-dropzone"
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <span className="material-symbols-outlined">upload_file</span>
              </div>
              <p>
                <span>Click to upload</span> or drag and drop reference files
              </p>
              {resourceFiles.length > 0 && (
                <p style={{ color: '#059669', fontWeight: '600', marginTop: '0.5rem' }}>
                  {resourceFiles.length} file(s) selected
                </p>
              )}
              <p>{SUPPORTED_UPLOAD_LABEL} (max. 50MB)</p>
            </label>
          </section>

          <section className="create-assignment-card">
            <div className="create-assignment-toggle-row">
              <div>
                <h3>Allow Late Submission</h3>
                <p>Students can submit after the deadline with a penalty</p>
              </div>
              <label className="create-assignment-switch">
                <input
                  type="checkbox"
                  name="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                  disabled={isLoading}
                />
                <span />
              </label>
            </div>
          </section>

          <div className="create-assignment-actions">
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', width: '100%' }}>
                {error}
              </div>
            )}
            {isCreated ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#059669', width: '100%' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>check_circle</span>
                <p style={{ marginTop: '0.5rem', fontWeight: '600' }}>Assignment Created Successfully!</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Redirecting to dashboard...</p>
              </div>
            ) : (
              <>
                <button type="submit" className="create-assignment-publish" disabled={isLoading}>
                  <span className="material-symbols-outlined">publish</span>
                  {isLoading ? 'Creating...' : 'Publish Assignment'}
                </button>
                <div>
                  <span className="material-symbols-outlined">info</span>
                  <p>This assignment will be visible to students under this subject.</p>
                </div>
              </>
            )}
          </div>
        </form>
      </main>

      <footer className="create-assignment-footer">
        <p>© 2024 University Digital Repository Platform. All faculty rights reserved.</p>
      </footer>
    </div>
  )
}

function FacultyAssignmentSubmissionsScreen({
  onGrade,
  currentPath,
  onNavigate,
  onLogout,
}: {
  onGrade: () => void
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
  onLogout: () => void
}) {
  return (
    <div className="faculty-submissions-page" aria-label="Assignment submissions overview">
      <CommonDashboardHeader
        title="Assignment Submissions"
        subtitle="Grading and Review"
        navItems={[
          { label: 'Dashboard', path: '/faculty_dashboard' },
          { label: 'Verification', path: '/faculty_verification' },
          { label: 'Textbooks', path: '/faculty_textbook_upload' },
          { label: 'Assignments', path: '/faculty_assignment_submissions' },
        ]}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        containerClassName="faculty-submissions-container"
      />

      <main className="faculty-submissions-container faculty-submissions-main">
        <div className="faculty-submissions-top">
          <div className="faculty-submissions-actions">
            <button type="button" className="faculty-submissions-outline-btn">
              <span className="material-symbols-outlined">download</span>
              Export CSV
            </button>
            <button type="button" className="faculty-submissions-primary-btn">
              <span className="material-symbols-outlined">publish</span>
              Release Grades
            </button>
          </div>
        </div>

        <section className="faculty-submissions-title-block">
          <h1>Assignment Submissions - Memory Mapping Lab</h1>
          <div />
          <p>
            Review and grade student submissions for the CS301 Laboratory Session 4. Ensure all late submissions are
            marked before final grade release.
          </p>
        </section>

        <section className="faculty-submissions-stats">
          <article className="faculty-submissions-stat-card">
            <div>
              <p>Total Students</p>
              <span className="material-symbols-outlined">group</span>
            </div>
            <h3>60</h3>
            <small>Enrolled</small>
          </article>
          <article className="faculty-submissions-stat-card">
            <div>
              <p>Submitted</p>
              <span className="material-symbols-outlined text-success">check_circle</span>
            </div>
            <h3 className="text-success">45</h3>
            <small className="text-success">+75% Complete</small>
          </article>
          <article className="faculty-submissions-stat-card">
            <div>
              <p>Pending</p>
              <span className="material-symbols-outlined">hourglass_empty</span>
            </div>
            <h3 className="text-muted">10</h3>
            <small>In progress</small>
          </article>
          <article className="faculty-submissions-stat-card">
            <div>
              <p>Late</p>
              <span className="material-symbols-outlined text-warning">error</span>
            </div>
            <h3 className="text-warning">5</h3>
            <small>After Oct 12</small>
          </article>
        </section>

        <section className="faculty-submissions-table-card">
          <div className="faculty-submissions-table-head">
            <div className="faculty-submissions-search">
              <span className="material-symbols-outlined">search</span>
              <input type="text" placeholder="Search by name or USN..." />
            </div>
            <div className="faculty-submissions-table-controls">
              <button type="button">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              <select defaultValue="All Submissions">
                <option>All Submissions</option>
                <option>Submitted</option>
                <option>Late</option>
                <option>Pending</option>
              </select>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Submission Time</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="faculty-submissions-student">
                      <span>AM</span>
                      <strong>Aditi Mishra</strong>
                    </div>
                  </td>
                  <td className="muted">1RV21CS001</td>
                  <td className="muted">Oct 12, 2023 10:45 AM</td>
                  <td>
                    <span className="faculty-submissions-badge submitted">Submitted</span>
                  </td>
                  <td className="align-right">
                    <div className="faculty-submissions-row-actions">
                      <button type="button" className="faculty-submissions-view-btn">
                        View Submission
                      </button>
                      <button type="button" className="faculty-submissions-grade-btn" onClick={onGrade}>
                        Grade
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="faculty-submissions-student">
                      <span>RJ</span>
                      <strong>Rahul Jain</strong>
                    </div>
                  </td>
                  <td className="muted">1RV21CS042</td>
                  <td className="muted">Oct 12, 2023 11:15 PM</td>
                  <td>
                    <span className="faculty-submissions-badge late">Late</span>
                  </td>
                  <td className="align-right">
                    <div className="faculty-submissions-row-actions">
                      <button type="button" className="faculty-submissions-view-btn">
                        View Submission
                      </button>
                      <button type="button" className="faculty-submissions-grade-btn" onClick={onGrade}>
                        Grade
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="faculty-submissions-student">
                      <span>SK</span>
                      <strong>Sneha Kapoor</strong>
                    </div>
                  </td>
                  <td className="muted">1RV21CS085</td>
                  <td className="muted">Oct 12, 2023 09:30 AM</td>
                  <td>
                    <span className="faculty-submissions-badge submitted">Submitted</span>
                  </td>
                  <td className="align-right">
                    <div className="faculty-submissions-row-actions">
                      <button type="button" className="faculty-submissions-view-btn">
                        View Submission
                      </button>
                      <button type="button" className="faculty-submissions-grade-btn" onClick={onGrade}>
                        Grade
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="faculty-submissions-student">
                      <span>VP</span>
                      <strong>Vikram Patil</strong>
                    </div>
                  </td>
                  <td className="muted">1RV21CS102</td>
                  <td className="muted">No submission</td>
                  <td>
                    <span className="faculty-submissions-badge pending">Pending</span>
                  </td>
                  <td className="align-right">
                    <div className="faculty-submissions-row-actions disabled">
                      <button type="button" className="faculty-submissions-view-btn" disabled>
                        View Submission
                      </button>
                      <button type="button" className="faculty-submissions-grade-btn" disabled>
                        Grade
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="faculty-submissions-pagination">
            <p>Showing 1 to 5 of 60 students</p>
            <div>
              <button type="button">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button type="button" className="active">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <span>...</span>
              <button type="button">12</button>
              <button type="button">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="faculty-submissions-footer faculty-submissions-container">
        <div>
          <p>© 2023 University Digital Repository</p>
          <a href="#">Privacy Policy</a>
          <a href="#">Support</a>
        </div>
        <p>Platform version 2.4.1-stable</p>
      </footer>
    </div>
  )
}

function FacultyGradeSubmissionScreen() {
  return (
    <div className="faculty-grade-page" aria-label="Faculty grading and feedback">
      <header className="faculty-grade-header">
        <div className="faculty-grade-container faculty-grade-header-row">
          <div className="faculty-grade-brand">
            <div className="faculty-grade-brand-icon">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h2>Institutional Grading Portal</h2>
          </div>
          <nav className="faculty-grade-nav">
            <a href="#">Dashboard</a>
            <a href="#" className="active">
              Courses
            </a>
            <a href="#">Students</a>
            <a href="#">Reports</a>
          </nav>
          <div className="faculty-grade-avatar">
            <span className="material-symbols-outlined">account_circle</span>
          </div>
        </div>
      </header>

      <main className="faculty-grade-container faculty-grade-main">
        <div className="faculty-grade-success">
          <span className="material-symbols-outlined">check_circle</span>
          <p>Grade saved successfully</p>
        </div>

        <section className="faculty-grade-title">
          <div className="faculty-grade-breadcrumb">
            <a href="#">Courses</a>
            <span className="material-symbols-outlined">chevron_right</span>
            <a href="#">Advanced Algorithms</a>
            <span className="material-symbols-outlined">chevron_right</span>
            <span>Project Phase 1</span>
          </div>
          <h1>Grade Submission: Arjun Mehra</h1>
          <div className="faculty-grade-title-accent" />
        </section>

        <div className="faculty-grade-layout">
          <section className="faculty-grade-left">
            <article className="faculty-grade-card">
              <h3>
                <span className="material-symbols-outlined">person</span>
                Submission Details
              </h3>
              <div className="faculty-grade-details-grid">
                <div>
                  <p>Student Name</p>
                  <strong>Arjun Mehra</strong>
                </div>
                <div>
                  <p>USN / Student ID</p>
                  <strong>1MS20CS042</strong>
                </div>
                <div>
                  <p>Submitted On</p>
                  <strong>Oct 24, 2023 • 11:42 AM</strong>
                </div>
                <div>
                  <p>Attempt Number</p>
                  <strong>1 (Final)</strong>
                </div>
              </div>
            </article>

            <article className="faculty-grade-card">
              <h3>
                <span className="material-symbols-outlined">description</span>
                Submitted Files
              </h3>
              <div className="faculty-grade-file-list">
                <div className="faculty-grade-file-item">
                  <div className="faculty-grade-file-meta">
                    <span className="material-symbols-outlined">description</span>
                    <div>
                      <p>Project_Phase1_Report.pdf</p>
                      <p>2.4 MB • PDF Document</p>
                    </div>
                  </div>
                  <button type="button" className="faculty-grade-download-icon-btn" aria-label="Download PDF file">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
                <div className="faculty-grade-file-item">
                  <div className="faculty-grade-file-meta">
                    <span className="material-symbols-outlined">folder_zip</span>
                    <div>
                      <p>Algorithm_Source_Code.zip</p>
                      <p>14.8 MB • Compressed Archive</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="faculty-grade-download-icon-btn"
                    aria-label="Download ZIP file"
                  >
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
                <div className="faculty-grade-file-item">
                  <div className="faculty-grade-file-meta">
                    <span className="material-symbols-outlined">table</span>
                    <div>
                      <p>Data_Analysis_Results.xlsx</p>
                      <p>842 KB • Excel Spreadsheet</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="faculty-grade-download-icon-btn"
                    aria-label="Download spreadsheet file"
                  >
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
              </div>
            </article>

            <div className="faculty-grade-preview">
              <span className="material-symbols-outlined">visibility</span>
              <p>Select a file to preview it here.</p>
            </div>
          </section>

          <aside className="faculty-grade-right">
            <article className="faculty-grade-card faculty-grade-panel">
              <h3>Grading Panel</h3>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                }}
              >
                <div className="faculty-grade-field">
                  <label htmlFor="marks-secured">Marks Secured</label>
                  <div className="faculty-grade-marks-wrap">
                    <input id="marks-secured" type="number" step="0.5" defaultValue="85.5" />
                    <span>/ 100</span>
                  </div>
                </div>

                <div className="faculty-grade-field">
                  <label>Submission Status</label>
                  <div className="faculty-grade-toggle">
                    <button type="button" className="active">
                      Graded
                    </button>
                    <button type="button">Needs Revision</button>
                  </div>
                </div>

                <button type="submit" className="faculty-grade-save">
                  <span className="material-symbols-outlined">save</span>
                  Save Grade
                </button>
                <p>Last autosaved at 12:04 PM</p>
              </form>
            </article>

            <article className="faculty-grade-help">
              <span className="material-symbols-outlined">info</span>
              <div>
                <h4>Grading Rubric Active</h4>
                <p>
                  This assignment follows the &quot;Engineering Phase 1&quot; rubric. Hover over marks to see
                  breakdown.
                </p>
              </div>
            </article>
          </aside>
        </div>
      </main>

      <footer className="faculty-grade-footer">
        <p>© 2023 Institutional Learning Management System. All rights reserved.</p>
      </footer>
    </div>
  )
}

function UnofficialNotesScreen() {
  const [uploadedNotes, setUploadedNotes] = useState<UploadedNote[]>(initialUploadedNotes)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpenUploadPicker = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    const now = new Date()
    const newNotes: UploadedNote[] = []
    let rejectedCount = 0

    Array.from(files).forEach((file) => {
      try {
        enforceSupportedUploadFile(file, 25 * 1024 * 1024)
        newNotes.push({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          title: file.name,
          uploadedOn: formatUploadDate(now),
          fileInfo: `${file.name.split('.').pop()?.toUpperCase() || 'FILE'} • ${formatFileSize(file.size)}`,
          status: 'pending',
          canDownload: true,
          downloadUrl: URL.createObjectURL(file),
          fileName: file.name,
        })
      } catch {
        rejectedCount += 1
      }
    })

    if (newNotes.length > 0) {
      setUploadedNotes((current) => [...newNotes, ...current])
    }
    setUploadError(
      rejectedCount > 0
        ? `${rejectedCount} file(s) rejected. Use only ${SUPPORTED_UPLOAD_LABEL} under 25MB.`
        : null,
    )
    event.target.value = ''
  }

  const handleDownload = (note: UploadedNote) => {
    if (!note.downloadUrl || !note.canDownload) {
      return
    }

    const link = document.createElement('a')
    link.href = note.downloadUrl
    link.download = note.fileName ?? note.title
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="unofficial-page" aria-label="Student unofficial notes portal">
      <header className="unofficial-header">
        <div className="dashboard-container unofficial-header-row">
          <div>
            <h1>Unofficial Notes</h1>
            <div className="unofficial-header-accent" />
          </div>
          <div className="unofficial-header-right">
            <button type="button" className="dashboard-upload-btn" onClick={handleOpenUploadPicker}>
              <span className="material-symbols-outlined">cloud_upload</span>
              Upload Notes
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_UPLOAD_ACCEPT}
              multiple
              className="visually-hidden-input"
              onChange={handleFilesSelected}
            />
            {uploadError ? (
              <p style={{ margin: '0.5rem 0 0', color: '#b91c1c', fontSize: '0.8125rem' }}>{uploadError}</p>
            ) : null}
            <div className="dashboard-user">
              <div className="dashboard-user-info">
                <p>Alex Thompson</p>
                <p>5th Sem • CS</p>
              </div>
              <div className="dashboard-avatar">
                <span className="material-symbols-outlined">account_circle</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-container unofficial-main">
        <div className="unofficial-grid">
          <aside className="unofficial-column">
            <section className="dashboard-card">
              <div className="unofficial-card-head">
                <div className="dashboard-section-title">
                  <span className="material-symbols-outlined">folder_shared</span>
                  <h2>My Uploads</h2>
                </div>
                <span>{uploadedNotes.length} Total</span>
              </div>

              <div className="unofficial-upload-list">
                {uploadedNotes.map((note) => (
                  <article key={note.id} className="unofficial-upload-item">
                    <div className="unofficial-upload-top">
                      <div>
                        <h3>{note.title}</h3>
                        <p>{note.uploadedOn}</p>
                      </div>
                      <span className={`unofficial-badge ${note.status}`}>{note.status}</span>
                    </div>
                    <div className="unofficial-upload-bottom">
                      <span>{note.fileInfo}</span>
                      <button
                        type="button"
                        className="dashboard-btn-primary dashboard-btn-small"
                        disabled={!note.canDownload}
                        onClick={() => handleDownload(note)}
                      >
                        <span className="material-symbols-outlined">download</span>
                        Download
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>

          <section className="unofficial-column unofficial-search-column">
            <section className="dashboard-card">
              <div className="dashboard-section-title">
                <span className="material-symbols-outlined">search</span>
                <h2>Find Notes</h2>
              </div>

              <div className="unofficial-searchbox">
                <span className="material-symbols-outlined">search</span>
                <input type="text" placeholder="Search by topic, unit, or author name..." />
              </div>

              <div className="unofficial-filters">
                <button type="button" className="unofficial-filter-head">
                  <span>
                    <span className="material-symbols-outlined">tune</span>
                    Advanced Filters
                  </span>
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
                <div className="unofficial-filter-body">
                  <div className="unofficial-filter-grid">
                    <div className="field-group">
                      <label>Unit / Chapter</label>
                      <select defaultValue="All Units">
                        <option>All Units</option>
                        <option>Unit 1: Introduction</option>
                        <option>Unit 2: Processes</option>
                        <option>Unit 3: Scheduling</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>Sort By</label>
                      <select defaultValue="Most Recent">
                        <option>Most Recent</option>
                        <option>Highest Rated</option>
                        <option>Verified First</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <p className="unofficial-label">File Type</p>
                    <div className="unofficial-chip-row">
                      <button type="button" className="unofficial-chip active">All</button>
                      <button type="button" className="unofficial-chip">PDF</button>
                      <button type="button" className="unofficial-chip">DOCX</button>
                      <button type="button" className="unofficial-chip">Images</button>
                      <button type="button" className="unofficial-chip">Handwritten</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="unofficial-results">
                <h3>Results (24)</h3>
                <div className="unofficial-result-list">
                  <article className="unofficial-result-item">
                    <div>
                      <div className="unofficial-doc-icon">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <h4>CPU Scheduling Algorithms Summary</h4>
                        <p>Uploaded By: Rahul Sharma (1RV21CS084)</p>
                      </div>
                    </div>
                    <button type="button" className="dashboard-icon-btn">
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </article>
                  <article className="unofficial-result-item">
                    <div>
                      <div className="unofficial-doc-icon">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <h4>File Systems - Complete Notes</h4>
                        <p>Uploaded By: Sneha Gupta (1RV21CS112)</p>
                      </div>
                    </div>
                    <button type="button" className="dashboard-icon-btn">
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </article>
                  <article className="unofficial-result-item">
                    <div>
                      <div className="unofficial-doc-icon">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <h4>Banker's Algorithm Flowchart</h4>
                        <p>Uploaded By: Mark Johnson (1RV21CS045)</p>
                      </div>
                    </div>
                    <button type="button" className="dashboard-icon-btn">
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </article>
                </div>
              </div>
            </section>
          </section>
        </div>
      </main>

      <footer className="dashboard-footer dashboard-container">
        <div>
          <p>© 2024 Academic Digital Repository • Unofficial Notes Portal</p>
        </div>
        <nav aria-label="Footer links">
          <a href="#">Portal Guidelines</a>
          <a href="#">Verification Criteria</a>
          <a href="#">Report Abuse</a>
        </nav>
      </footer>
    </div>
  )
}

type SearchResource = {
  id: string
  title: string
  subjectCode: string
  semester: string
  unit: string
  professor: string
  status: 'approved' | 'pending' | 'rejected'
  format: 'PDF' | 'PPTX' | 'DOCX' | 'JPG' | 'PNG'
  size: string
  uploadedAt: string
}

const searchResourceData: SearchResource[] = [
  {
    id: 'res-1',
    title: 'Memory Management Overview',
    subjectCode: 'CS501',
    semester: 'Semester 5',
    unit: 'Unit 4',
    professor: 'Dr. Robert Wilson',
    status: 'approved',
    format: 'PDF',
    size: '1.2 MB',
    uploadedAt: 'Oct 12, 2023',
  },
  {
    id: 'res-2',
    title: 'Process Synchronization Slides',
    subjectCode: 'CS501',
    semester: 'Semester 5',
    unit: 'Unit 3',
    professor: 'Dr. Robert Wilson',
    status: 'approved',
    format: 'PPTX',
    size: '3.8 MB',
    uploadedAt: 'Oct 05, 2023',
  },
  {
    id: 'res-3',
    title: 'Normalization Cheat Sheet',
    subjectCode: 'CS502',
    semester: 'Semester 5',
    unit: 'Unit 2',
    professor: 'Dr. Sarah Jenkins',
    status: 'pending',
    format: 'DOCX',
    size: '420 KB',
    uploadedAt: 'Sep 29, 2023',
  },
  {
    id: 'res-4',
    title: 'OSI Model Diagram',
    subjectCode: 'CS503',
    semester: 'Semester 5',
    unit: 'Unit 1',
    professor: 'Dr. Alan Green',
    status: 'approved',
    format: 'PNG',
    size: '760 KB',
    uploadedAt: 'Oct 08, 2023',
  },
  {
    id: 'res-5',
    title: 'Database ER Model',
    subjectCode: 'CS502',
    semester: 'Semester 5',
    unit: 'Unit 1',
    professor: 'Dr. Sarah Jenkins',
    status: 'rejected',
    format: 'JPG',
    size: '540 KB',
    uploadedAt: 'Oct 01, 2023',
  },
]

function SearchResultsScreen({ onBackDashboard }: { onBackDashboard: () => void }) {
  const [subjectCode, setSubjectCode] = useState('All Subjects')
  const [semester, setSemester] = useState('All Semesters')
  const [professor, setProfessor] = useState('All Professors')
  const [query, setQuery] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('Document.pdf')

  const results = searchResourceData.filter((resource) => {
    const isVisible = resource.status === 'approved'
    const subjectMatch = subjectCode === 'All Subjects' || resource.subjectCode === subjectCode
    const semesterMatch = semester === 'All Semesters' || resource.semester === semester
    const professorMatch = professor === 'All Professors' || resource.professor === professor
    const queryMatch =
      query.trim() === '' ||
      resource.title.toLowerCase().includes(query.toLowerCase()) ||
      resource.subjectCode.toLowerCase().includes(query.toLowerCase()) ||
      resource.professor.toLowerCase().includes(query.toLowerCase())

    return isVisible && subjectMatch && semesterMatch && professorMatch && queryMatch
  })

  return (
    <div className="search-page" aria-label="Search repository results">
      <header className="search-header">
        <div className="dashboard-container search-header-content">
          <nav className="assignment-breadcrumb" aria-label="Breadcrumb">
            <button type="button" className="search-breadcrumb-btn" onClick={onBackDashboard}>
              Dashboard
            </button>
            <span className="material-symbols-outlined">chevron_right</span>
            <span>Search Results</span>
          </nav>
          <div className="search-title-row">
            <h1>Repository Search</h1>
            <button type="button" className="dashboard-btn-secondary dashboard-btn-small" onClick={onBackDashboard}>
              Back to Dashboard
            </button>
          </div>
        </div>
        <div className="assignment-header-accent" />
      </header>

      <main className="dashboard-container search-main">
        <section className="dashboard-card">
          <div className="search-filter-head">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">filter_alt</span>
              <h2>Advanced Filters</h2>
            </div>
            <button
              type="button"
              className="search-filter-toggle"
              onClick={() => setShowAdvancedFilters((current) => !current)}
              aria-expanded={showAdvancedFilters}
              aria-controls="repository-advanced-filters"
            >
              {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
              <span className="material-symbols-outlined">
                {showAdvancedFilters ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
          {showAdvancedFilters ? (
            <div id="repository-advanced-filters" className="search-filter-grid">
              <div className="field-group">
                <label htmlFor="search-keyword">Keyword</label>
                <input
                  id="search-keyword"
                  type="text"
                  placeholder="Title, subject code, or professor"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label htmlFor="search-subject-code">Subject Code</label>
                <select id="search-subject-code" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)}>
                  <option>All Subjects</option>
                  <option>CS501</option>
                  <option>CS502</option>
                  <option>CS503</option>
                </select>
              </div>
              <div className="field-group">
                <label htmlFor="search-semester">Semester</label>
                <select id="search-semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
                  <option>All Semesters</option>
                  <option>Semester 5</option>
                  <option>Semester 6</option>
                </select>
              </div>
              <div className="field-group">
                <label htmlFor="search-professor">Professor</label>
                <select id="search-professor" value={professor} onChange={(e) => setProfessor(e.target.value)}>
                  <option>All Professors</option>
                  <option>Dr. Robert Wilson</option>
                  <option>Dr. Sarah Jenkins</option>
                  <option>Dr. Alan Green</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="search-filter-collapsed-note">
              <p>Use filters to narrow by subject, semester, and professor.</p>
            </div>
          )}
        </section>

        <section className="dashboard-card search-results-card">
          <div className="search-results-head">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">travel_explore</span>
              <h2>Search Results</h2>
            </div>
            <p>
              <span>{results.length}</span> files found
            </p>
          </div>

          {results.length === 0 ? (
            <div className="search-empty-state">
              <span className="material-symbols-outlined">search_off</span>
              <p>No matching files found. Try changing your filters.</p>
            </div>
          ) : (
            <div className="search-results-grid">
              {results.map((resource) => (
                <article key={resource.id} className="search-result-item">
                  <div>
                    <h3>{resource.title}</h3>
                    <p>
                      {resource.subjectCode} • {resource.semester} • {resource.unit}
                    </p>
                  </div>
                  <div className="search-result-meta">
                    <span>{resource.professor}</span>
                    <span>
                      {resource.format} • {resource.size}
                    </span>
                    <span>{resource.uploadedAt}</span>
                  </div>
                  <div className="search-result-actions">
                    <button
                      type="button"
                      className="dashboard-btn-secondary dashboard-btn-small"
                      onClick={() => {
                        setPreviewTitle(`${resource.title}.${resource.format.toLowerCase()}`)
                        setIsPreviewOpen(true)
                      }}
                    >
                      <span className="material-symbols-outlined">visibility</span>
                      View
                    </button>
                    <button type="button" className="dashboard-btn-primary dashboard-btn-small">
                      <span className="material-symbols-outlined">download</span>
                      Download
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="dashboard-footer dashboard-container">
        <div>
          <p>© 2024 University Academic Digital Repository</p>
        </div>
        <nav aria-label="Footer links">
          <a href="#">Help Center</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Support</a>
        </nav>
      </footer>
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        title={previewTitle}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}

function StudentRepositoryScreen({ onBackDashboard }: { onBackDashboard: () => void }) {
  const [semester, setSemester] = useState('Semester 5')
  const [subjectCode, setSubjectCode] = useState('All Subjects')
  const [unit, setUnit] = useState('All Units')
  const [professor, setProfessor] = useState('All Professors')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTitle, setPreviewTitle] = useState('Document.pdf')

  const resources = searchResourceData.filter((resource) => {
    const semesterMatch = semester === 'All Semesters' || resource.semester === semester
    const subjectMatch = subjectCode === 'All Subjects' || resource.subjectCode === subjectCode
    const unitMatch = unit === 'All Units' || resource.unit === unit
    const professorMatch = professor === 'All Professors' || resource.professor === professor
    return resource.status === 'approved' && semesterMatch && subjectMatch && unitMatch && professorMatch
  })

  const approvedResources = searchResourceData.filter((resource) => resource.status === 'approved')
  const professorOptions = Array.from(new Set(approvedResources.map((resource) => resource.professor)))

  return (
    <div className="search-page" aria-label="Structured repository browser">
      <header className="search-header">
        <div className="dashboard-container search-header-content">
          <nav className="assignment-breadcrumb" aria-label="Breadcrumb">
            <button type="button" className="search-breadcrumb-btn" onClick={onBackDashboard}>
              Dashboard
            </button>
            <span className="material-symbols-outlined">chevron_right</span>
            <span>Repository</span>
          </nav>
          <div className="search-title-row">
            <h1>Repository Browser</h1>
            <button type="button" className="dashboard-btn-secondary dashboard-btn-small" onClick={onBackDashboard}>
              Back
            </button>
          </div>
        </div>
        <div className="assignment-header-accent" />
      </header>

      <main className="dashboard-container search-main">
        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">account_tree</span>
            <h2>Semester → Subject → Unit</h2>
          </div>
          <div className="search-filter-grid">
            <div className="field-group">
              <label htmlFor="repository-semester">Semester</label>
              <select id="repository-semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option>All Semesters</option>
                <option>Semester 5</option>
                <option>Semester 6</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="repository-subject">Subject</label>
              <select id="repository-subject" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)}>
                <option>All Subjects</option>
                <option>CS501</option>
                <option>CS502</option>
                <option>CS503</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="repository-unit">Unit</label>
              <select id="repository-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option>All Units</option>
                <option>Unit 1</option>
                <option>Unit 2</option>
                <option>Unit 3</option>
                <option>Unit 4</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="repository-professor">Uploaded By</label>
              <select
                id="repository-professor"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
              >
                <option>All Professors</option>
                {professorOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="dashboard-card search-results-card">
          <div className="search-results-head">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">folder_open</span>
              <h2>Approved Resources</h2>
            </div>
            <p>
              <span>{resources.length}</span> approved files
            </p>
          </div>
          <div className="search-results-grid">
            {resources.map((resource) => (
              <article key={resource.id} className="search-result-item">
                <div>
                  <h3>{resource.title}</h3>
                  <p>
                    {resource.semester} • {resource.subjectCode} • {resource.unit}
                  </p>
                </div>
                <div className="search-result-meta">
                  <span>Uploaded by: {resource.professor}</span>
                  <span>Type: {resource.format} • {resource.size}</span>
                  <span>Status: <strong>Approved</strong> • {resource.uploadedAt}</span>
                </div>
                <div className="search-result-actions">
                  <button
                    type="button"
                    className="dashboard-btn-secondary dashboard-btn-small"
                    onClick={() => {
                      setPreviewTitle(`${resource.title}.${resource.format.toLowerCase()}`)
                      setIsPreviewOpen(true)
                    }}
                  >
                    <span className="material-symbols-outlined">visibility</span>
                    View
                  </button>
                  <button type="button" className="dashboard-btn-primary dashboard-btn-small">
                    <span className="material-symbols-outlined">download</span>
                    Download
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        title={previewTitle}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}

function AssignmentReviewScreen({ onBackToDashboard }: { onBackToDashboard?: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [comment, setComment] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      try {
        newFiles.forEach((file) => {
          enforceSupportedUploadFile(file, 25 * 1024 * 1024)
        })
        setFiles((prev) => [...prev, ...newFiles])
        setError(null)
      } catch (err) {
        setError(err instanceof FileUploadError ? err.message : 'Invalid file')
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please upload at least one file')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await assignmentService.submitAssignment('assign-1', files, comment)
      setIsSubmitted(true)
      setTimeout(() => {
        if (onBackToDashboard) {
          onBackToDashboard()
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="assignment-page" aria-label="Assignment submission details">
      <header className="assignment-header">
        <div className="dashboard-container assignment-header-content">
          <nav className="assignment-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={onBackToDashboard} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
              Assignments
            </button>
            <span className="material-symbols-outlined">chevron_right</span>
            <button type="button" onClick={onBackToDashboard} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
              CS501
            </button>
            <span className="material-symbols-outlined">chevron_right</span>
            <span>Assignment 2</span>
          </nav>

          <div className="assignment-title-row">
            <h1>Assignment 2 - SQL Joins</h1>
            <div className="dashboard-user">
              <div className="dashboard-user-info">
                <p>Alex Thompson</p>
                <p>Semester 5 • CS</p>
              </div>
              <div className="dashboard-avatar">
                <span className="material-symbols-outlined">account_circle</span>
              </div>
            </div>
          </div>
        </div>
        <div className="assignment-header-accent" />
      </header>

      <main className="dashboard-container assignment-main">
        <div className="assignment-layout">
          <section className="assignment-card assignment-details">
            <div className="assignment-badges">
              <span className="assignment-badge blue">Subject: CS501</span>
              <span className="assignment-badge neutral">Unit 3</span>
              <span className="assignment-badge green">Marks: 50</span>
            </div>

            <div className="assignment-due-box">
              <div>
                <p>Due Date</p>
                <h2>November 24, 2023 at 11:59 PM</h2>
              </div>
              <span className="assignment-badge warning">
                <span className="material-symbols-outlined">timer</span>
                Due soon
              </span>
            </div>

            <div className="assignment-instructions">
              <h3>
                <span className="material-symbols-outlined">description</span>
                Instructions
              </h3>
              <p>
                In this assignment, you are required to demonstrate your understanding of complex SQL Joins. You
                will be working with a sample database of a library system. Please ensure your queries are optimized
                and include comments explaining your logic.
              </p>
              <ul>
                <li>Write queries for Inner, Left, Right, and Full Outer joins.</li>
                <li>Include at least two queries with multiple join conditions.</li>
                <li>Implement a self-join for the Staff Hierarchy table.</li>
                <li>Export your results in a single .sql file.</li>
                <li>Provide a brief PDF report explaining the execution plan for Query #4.</li>
              </ul>
            </div>

            <div className="assignment-resources">
              <h3>
                <span className="material-symbols-outlined">folder_open</span>
                Faculty Resources
              </h3>
              <div className="assignment-resource-list">
                <button type="button" className="assignment-resource-btn">
                  <span className="material-symbols-outlined">description</span>
                  Database_Schema.pdf
                  <span className="material-symbols-outlined">download</span>
                </button>
                <button type="button" className="assignment-resource-btn">
                  <span className="material-symbols-outlined">table_chart</span>
                  Sample_Data.docx
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
            </div>
          </section>

          <aside className="assignment-sidebar">
            <section className="assignment-card">
              <div className="assignment-sidebar-head">
                <h2>Your Work</h2>
                <span>{isSubmitted ? 'Submitted' : 'Not Submitted'}</span>
              </div>
              {error && (
                <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}
              {!isSubmitted && (
                <>
                  {files.map((file, index) => (
                    <div key={index} className="assignment-uploaded-item">
                      <div>
                        <span className="material-symbols-outlined">description</span>
                        <p>{file.name} ({formatFileSize(file.size)})</p>
                      </div>
                      <button type="button" aria-label="Remove file" onClick={() => handleRemoveFile(index)}>
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  ))}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={SUPPORTED_UPLOAD_ACCEPT}
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    className="assignment-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined">upload_file</span>
                    <p>Add or create</p>
                    <p>Drag and drop or click to upload ({SUPPORTED_UPLOAD_LABEL})</p>
                  </button>

                  <div className="assignment-comments">
                    <h4>
                      <span className="material-symbols-outlined">forum</span>
                      Private comments
                    </h4>
                    <div>
                      <input
                        type="text"
                        placeholder="Add a comment to faculty..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="assignment-submit-btn"
                    onClick={handleSubmit}
                    disabled={isLoading || files.length === 0}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                  <p className="assignment-note">Submission will be timestamped and logged.</p>
                </>
              )}
              {isSubmitted && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#059669' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>check_circle</span>
                  <p style={{ marginTop: '0.5rem', fontWeight: '600' }}>Assignment Submitted Successfully!</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Redirecting to dashboard...</p>
                </div>
              )}
            </section>

            <section className="assignment-comments">
              <h4>
                <span className="material-symbols-outlined">forum</span>
                Private comments
              </h4>
              <div>
                <input type="text" placeholder="Add a comment to faculty..." />
                <button type="button">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <footer className="dashboard-footer dashboard-container">
        <div>
          <p>© 2024 University Academic Digital Repository</p>
        </div>
        <nav aria-label="Footer links">
          <a href="#">Help Center</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Support</a>
        </nav>
      </footer>
    </div>
  )
}

function AssignmentResultScreen({
  onBackToDashboard,
}: {
  onBackToDashboard?: () => void
}) {
  return (
    <div className="assignment-page" aria-label="Submission and grade status">
      <header className="assignment-header">
        <div className="dashboard-container result-header-content">
          <nav className="assignment-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={onBackToDashboard} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
              Assignments
            </button>
            <span className="result-breadcrumb-divider">/</span>
            <button type="button" onClick={onBackToDashboard} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
              CS501
            </button>
            <span className="result-breadcrumb-divider">/</span>
            <span>Lab Report</span>
          </nav>

          <div className="assignment-title-row">
            <h1 className="result-title">Memory Mapping Lab Report</h1>
            <div className="dashboard-user">
              <div className="dashboard-user-info">
                <p>Alex Thompson</p>
                <p>Semester 5 • CS501</p>
              </div>
              <div className="dashboard-avatar">
                <span className="material-symbols-outlined">account_circle</span>
              </div>
            </div>
          </div>
        </div>
        <div className="assignment-header-accent" />
      </header>

      <main className="dashboard-container assignment-main">
        <section className="assignment-card">
          <div className="result-status-head">
            <span className="material-symbols-outlined">info</span>
            <h2>Submission Status</h2>
            <span className="result-pill">Graded</span>
          </div>

          <div className="result-grid">
            <div className="result-left">
              <div>
                <p>Overall Grade</p>
                <h3>Grade: A+</h3>
              </div>
              <div>
                <p>Submission Date</p>
                <h4>Nov 01, 2023 • 11:45 PM</h4>
              </div>
            </div>

            <div className="result-feedback">
              <div>
                <span className="material-symbols-outlined">comment</span>
                <h3>Faculty Feedback</h3>
              </div>
              <p>
                "Excellent work on the memory mapping simulation. Your implementation of the paging mechanism was
                thorough and well-documented. The performance analysis section shows a deep understanding of TLB
                misses. Keep up the high standard of technical writing."
              </p>
              <div className="result-author">
                <span className="material-symbols-outlined">person</span>
                <span>Dr. Robert Wilson • Faculty of OS</span>
              </div>
            </div>
          </div>
        </section>

        <section className="assignment-card">
          <div className="result-files-head">
            <span className="material-symbols-outlined">folder_open</span>
            <h2>Submitted Files</h2>
          </div>

          <div className="result-files-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Upload Date &amp; Time</th>
                  <th className="align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="result-file-name">
                      <span className="material-symbols-outlined result-file-pdf">picture_as_pdf</span>
                      <div>
                        <p>Lab_Report_Memory_Mapping_Final.pdf</p>
                        <p>Main Document</p>
                      </div>
                    </div>
                  </td>
                  <td className="muted">2.4 MB</td>
                  <td className="muted">Nov 01, 2023 • 11:42 PM</td>
                  <td className="align-right">
                    <button type="button" className="result-view-btn">
                      <span className="material-symbols-outlined">visibility</span>
                      View File
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="result-file-name">
                      <span className="material-symbols-outlined">folder_zip</span>
                      <div>
                        <p>Source_Code_Simulation_v2.zip</p>
                        <p>Supporting File</p>
                      </div>
                    </div>
                  </td>
                  <td className="muted">15.8 MB</td>
                  <td className="muted">Nov 01, 2023 • 11:45 PM</td>
                  <td className="align-right">
                    <button type="button" className="result-view-btn">
                      <span className="material-symbols-outlined">visibility</span>
                      View File
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="result-note-box">
            <span className="material-symbols-outlined">warning</span>
            <p>
              Note: Files once submitted and graded can no longer be replaced or modified. If you notice any
              discrepancy in the uploaded files, please contact the faculty coordinator.
            </p>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer dashboard-container">
        <div>
          <p>© 2024 University Academic Digital Repository</p>
        </div>
        <nav aria-label="Footer links">
          <a href="#">Help Center</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Support</a>
        </nav>
      </footer>
    </div>
  )
}

function AdminEnrollStudentsScreen({
  onBackDashboard,
  onBackToAccounts,
}: {
  onBackDashboard: () => void
  onBackToAccounts: () => void
}) {
  const [selectedSubject, setSelectedSubject] = useState('CS-401')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(['1', '2'])
  const [programmeFilter, setProgrammeFilter] = useState('All Programmes')
  const [semesterFilter, setSemesterFilter] = useState('All Semesters')

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const toggleAllStudents = () => {
    if (selectedStudentIds.length === 3) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(['1', '2', '3'])
    }
  }

  const subjects = [
    { code: 'CS-401', name: 'Advanced Algorithms', programme: 'B.Tech CSE', semester: 'Sem IV' },
    { code: 'CS-405', name: 'Machine Learning Fundamentals', programme: 'B.Tech CSE', semester: 'Sem IV' },
    { code: 'CS-402', name: 'Distributed Systems', programme: 'B.Tech CSE', semester: 'Sem IV' },
  ]

  const students = [
    { id: '1', name: 'Aditi Sharma', usn: '1RV21CS001', programme: 'Computer Science', semester: '6th Sem', email: 'aditi.s@univ.edu.in' },
    { id: '2', name: 'Rahul Jayaram', usn: '1RV21IS045', programme: 'Info. Science', semester: '4th Sem', email: 'rahul.j@univ.edu.in' },
    { id: '3', name: 'Nikhil Kumar', usn: '1RV22ME088', programme: 'Mechanical', semester: '2nd Sem', email: 'nikhil.k@univ.edu.in' },
  ]

  return (
    <div className="admin-page" aria-label="Enroll students in subjects">
      <AdminHeader
        active="subjects"
        onNavigateDashboard={onBackDashboard}
        onNavigateFacultyAccounts={() => {}}
        onNavigateAssignSubjects={() => {}}
        onNavigateCirculars={() => {}}
      />

      <main className="admin-container admin-main">
        <section className="admin-assign-head">
          <nav aria-label="Breadcrumb">
            <button type="button" onClick={onBackDashboard} className="admin-breadcrumb-link">
              Dashboard
            </button>
            <span>/</span>
            <button type="button" onClick={onBackToAccounts} className="admin-breadcrumb-link">
              Student Accounts
            </button>
            <span>/</span>
            <span>Enroll Students</span>
          </nav>
          <h2>Enroll Students in Subjects</h2>
          <p>Select a subject and enroll students to grant them access to assignments and resources.</p>
        </section>

        <section className="admin-assign-layout">
          <article className="admin-assign-faculty-card">
            <label htmlFor="enroll-subject-select">Select Subject</label>
            <select
              id="enroll-subject-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="admin-assign-search"
            >
              {subjects.map((subject) => (
                <option key={subject.code} value={subject.code}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>

            <div className="admin-assign-profile">
              <div>
                <span className="material-symbols-outlined">book</span>
              </div>
              <div>
                <h3>{subjects.find((s) => s.code === selectedSubject)?.name}</h3>
                <p>{subjects.find((s) => s.code === selectedSubject)?.programme} • {subjects.find((s) => s.code === selectedSubject)?.semester}</p>
              </div>
            </div>

            <div className="admin-assign-meta">
              <div>
                <span>Currently Enrolled</span>
                <strong>24 Students</strong>
              </div>
              <div>
                <span>Capacity</span>
                <strong>60 Students</strong>
              </div>
            </div>
          </article>

          <article className="admin-assign-subjects-card">
            <div className="admin-assign-toolbar">
              <div>
                <select value={programmeFilter} onChange={(e) => setProgrammeFilter(e.target.value)}>
                  <option>All Programmes</option>
                  <option>Computer Science &amp; Engineering</option>
                  <option>Information Science</option>
                  <option>Electronics &amp; Communication</option>
                  <option>Mechanical Engineering</option>
                </select>
                <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
                  <option>All Semesters</option>
                  <option>1st Semester</option>
                  <option>2nd Semester</option>
                  <option>3rd Semester</option>
                  <option>4th Semester</option>
                  <option>5th Semester</option>
                  <option>6th Semester</option>
                </select>
              </div>
              <p>
                Showing <span>{students.length}</span> students
              </p>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.length === students.length}
                        onChange={toggleAllStudents}
                        aria-label="Select all students"
                      />
                    </th>
                    <th>Student Name</th>
                    <th>USN</th>
                    <th>Programme</th>
                    <th>Semester</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const isSelected = selectedStudentIds.includes(student.id)
                    return (
                      <tr key={student.id} className={isSelected ? 'admin-assign-row-selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudent(student.id)}
                            aria-label={`Select ${student.name}`}
                          />
                        </td>
                        <td>
                          <div className="admin-student-person">
                            <span className="gray">{student.name.split(' ').map(n => n[0]).join('')}</span>
                            <p>{student.name}</p>
                          </div>
                        </td>
                        <td className="mono">{student.usn}</td>
                        <td>{student.programme}</td>
                        <td>{student.semester}</td>
                        <td className="muted">{student.email}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-assign-actions">
              <button type="button">
                <span className="material-symbols-outlined">person_add</span>
                Enroll Selected Students ({selectedStudentIds.length})
              </button>
              <p>
                <span className="material-symbols-outlined">info</span>
                Enrolled students will have access to assignments, notes, and resources for this subject.
              </p>
            </div>
          </article>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}

function AdminStudentDetailsScreen({
  onBack,
}: {
  onBack: () => void
}) {
  return (
    <div className="admin-page" aria-label="Student details">
      <AdminHeader
        active="dashboard"
        onNavigateDashboard={onBack}
        onNavigateFacultyAccounts={() => {}}
        onNavigateAssignSubjects={() => {}}
        onNavigateCirculars={() => {}}
      />

      <main className="admin-container admin-main">
        <section className="admin-assign-head">
          <nav aria-label="Breadcrumb">
            <button type="button" onClick={onBack} className="admin-breadcrumb-link">
              Student Accounts
            </button>
            <span>/</span>
            <span>Student Details</span>
          </nav>
          <h2>Student Details</h2>
        </section>

        <section className="admin-content-grid">
          <article className="dashboard-card">
            <div className="admin-assign-profile" style={{ marginBottom: '2rem' }}>
              <div style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}>
                <span className="material-symbols-outlined">account_circle</span>
              </div>
              <div>
                <h3>Aditi Sharma</h3>
                <p>USN: 1RV21CS001</p>
              </div>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <tbody>
                  <tr>
                    <td><strong>Full Name</strong></td>
                    <td>Aditi Sharma</td>
                  </tr>
                  <tr>
                    <td><strong>USN</strong></td>
                    <td className="mono">1RV21CS001</td>
                  </tr>
                  <tr>
                    <td><strong>Email</strong></td>
                    <td>aditi.s@univ.edu.in</td>
                  </tr>
                  <tr>
                    <td><strong>Programme</strong></td>
                    <td>Computer Science &amp; Engineering</td>
                  </tr>
                  <tr>
                    <td><strong>Semester</strong></td>
                    <td>6th Semester</td>
                  </tr>
                  <tr>
                    <td><strong>Account Status</strong></td>
                    <td><span className="admin-student-status active">Active</span></td>
                  </tr>
                  <tr>
                    <td><strong>Registration Date</strong></td>
                    <td className="muted">Oct 15, 2023</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">book</span>
              <h2>Enrolled Subjects</h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Faculty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>CS501</td>
                    <td>Operating Systems</td>
                    <td className="muted">Dr. Robert Wilson</td>
                    <td><span className="admin-student-status active">Active</span></td>
                  </tr>
                  <tr>
                    <td>CS502</td>
                    <td>Database Management</td>
                    <td className="muted">Dr. Sarah Jenkins</td>
                    <td><span className="admin-student-status active">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">assignment</span>
              <h2>Assignment Submissions</h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Memory Mapping Lab</td>
                    <td className="muted">CS501</td>
                    <td><span className="pill success">Submitted</span></td>
                    <td>A+</td>
                  </tr>
                  <tr>
                    <td>SQL Joins</td>
                    <td className="muted">CS502</td>
                    <td><span className="pill">Pending</span></td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}

function AdminFacultyDetailsScreen({
  onBack,
}: {
  onBack: () => void
}) {
  return (
    <div className="admin-page" aria-label="Faculty details">
      <AdminHeader
        active="faculty"
        onNavigateDashboard={() => {}}
        onNavigateFacultyAccounts={onBack}
        onNavigateAssignSubjects={() => {}}
        onNavigateCirculars={() => {}}
      />

      <main className="admin-container admin-main">
        <section className="admin-assign-head">
          <nav aria-label="Breadcrumb">
            <button type="button" onClick={onBack} className="admin-breadcrumb-link">
              Faculty Accounts
            </button>
            <span>/</span>
            <span>Faculty Details</span>
          </nav>
          <h2>Faculty Details</h2>
        </section>

        <section className="admin-content-grid">
          <article className="dashboard-card">
            <div className="admin-assign-profile" style={{ marginBottom: '2rem' }}>
              <div style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}>
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div>
                <h3>Dr. David Anderson</h3>
                <p>Senior Professor • Computer Science</p>
              </div>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <tbody>
                  <tr>
                    <td><strong>Full Name</strong></td>
                    <td>Dr. David Anderson</td>
                  </tr>
                  <tr>
                    <td><strong>Email</strong></td>
                    <td>d.anderson@university.edu</td>
                  </tr>
                  <tr>
                    <td><strong>Department</strong></td>
                    <td>Computer Science</td>
                  </tr>
                  <tr>
                    <td><strong>Designation</strong></td>
                    <td>Senior Professor</td>
                  </tr>
                  <tr>
                    <td><strong>Account Status</strong></td>
                    <td><span className="admin-faculty-status active">Active</span></td>
                  </tr>
                  <tr>
                    <td><strong>Join Date</strong></td>
                    <td className="muted">Jan 15, 2020</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">book</span>
              <h2>Assigned Subjects</h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Programme</th>
                    <th>Enrolled Students</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>CS-401</td>
                    <td>Advanced Algorithms</td>
                    <td className="muted">B.Tech CSE</td>
                    <td>45</td>
                  </tr>
                  <tr>
                    <td>CS-405</td>
                    <td>Machine Learning Fundamentals</td>
                    <td className="muted">B.Tech CSE</td>
                    <td>38</td>
                  </tr>
                  <tr>
                    <td>CS-402</td>
                    <td>Distributed Systems</td>
                    <td className="muted">B.Tech CSE</td>
                    <td>42</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">assignment</span>
              <h2>Created Assignments</h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Subject</th>
                    <th>Due Date</th>
                    <th>Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Memory Mapping Lab</td>
                    <td className="muted">CS-401</td>
                    <td className="muted">Nov 12, 2023</td>
                    <td>45/60</td>
                  </tr>
                  <tr>
                    <td>Algorithm Analysis</td>
                    <td className="muted">CS-401</td>
                    <td className="muted">Nov 20, 2023</td>
                    <td>12/60</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>

      <AdminFooter />
    </div>
  )
}

function ForgotPasswordScreen({
  onBack,
  onResetPassword,
}: {
  onBack: () => void
  onResetPassword: () => void
}) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await authService.forgotPassword(email)
      setSuccess(true)
      setTimeout(() => {
        onResetPassword()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-login-card" aria-label="Forgot password">
        <div className="student-card-content">
          <button type="button" className="back-link" onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </button>

          <div className="student-logo-wrap">
            <div className="student-logo-shell">
              <span className="material-symbols-outlined icon-school">lock_reset</span>
            </div>
          </div>

          <div className="student-heading">
            <h1 className="student-title">Forgot Password</h1>
            <p>Enter your email to receive a password reset link</p>
          </div>

          <div className="student-accent" />

          <form className="student-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Reset link sent! Check your email.
              </div>
            )}
            <div className="field-group">
              <label htmlFor="resetEmail">Educational Email</label>
              <input
                id="resetEmail"
                type="email"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || success}
              />
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn" disabled={isLoading || success}>
                {isLoading ? 'Sending...' : success ? 'Link Sent!' : 'Send Reset Link'}
              </button>
            </div>
          </form>

          <div className="student-register-cta">
            <p>
              Remember your password?{' '}
              <button type="button" className="inline-link" onClick={onBack}>
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <p>© 2024 University Digital Repository</p>
      </footer>
    </>
  )
}

function ResetPasswordScreen({
  onBack,
  onLogin,
}: {
  onBack: () => void
  onLogin: () => void
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Get token from URL query params (mock - in real app, extract from URL)
  const token = 'mock-reset-token'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => {
        onLogin()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="student-login-card" aria-label="Reset password">
        <div className="student-card-content">
          <button type="button" className="back-link" onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </button>

          <div className="student-logo-wrap">
            <div className="student-logo-shell">
              <span className="material-symbols-outlined icon-school">lock</span>
            </div>
          </div>

          <div className="student-heading">
            <h1 className="student-title">Reset Password</h1>
            <p>Enter your new password</p>
          </div>

          <div className="student-accent" />

          <form className="student-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Password reset successful! Redirecting...
              </div>
            )}
            <div className="field-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-wrap">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || success}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <div className="password-wrap">
                <input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading || success}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn" disabled={isLoading || success}>
                {isLoading ? 'Resetting...' : success ? 'Success!' : 'Reset Password'}
              </button>
            </div>
          </form>

          <div className="student-register-cta">
            <p>
              Remember your password?{' '}
              <button type="button" className="inline-link" onClick={onBack}>
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <p>© 2024 University Digital Repository</p>
      </footer>
    </>
  )
}

function App() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth()
  const [path, setPath] = useState<RoutePath>(() => normalizePath(window.location.pathname))
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)
  const [notices, setNotices] = useState<DepartmentNotice[]>(() => {
    const raw = localStorage.getItem('department_notices')
    if (!raw) {
      return defaultDepartmentNotices
    }
    try {
      const parsed = JSON.parse(raw) as DepartmentNotice[]
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return defaultDepartmentNotices
      }
      return parsed.map((notice) => ({
        ...notice,
        urgent: Boolean((notice as Partial<DepartmentNotice>).urgent),
        authorRole: (notice as Partial<DepartmentNotice>).authorRole === 'faculty' ? 'faculty' : 'admin',
      }))
    } catch {
      return defaultDepartmentNotices
    }
  })

  useEffect(() => {
    const normalized = normalizePath(window.location.pathname)
    if (window.location.pathname !== normalized) {
      window.history.replaceState({}, '', normalized)
    }

    const onPopState = () => setPath(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    localStorage.setItem('department_notices', JSON.stringify(notices))
  }, [notices])

  useEffect(() => {
    if (!sessionNotice) {
      return
    }
    const timer = window.setTimeout(() => setSessionNotice(null), 4500)
    return () => window.clearTimeout(timer)
  }, [sessionNotice])

  const navigate = (nextPath: RoutePath) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  const createNotice = ({ title, content, urgent = false }: { title: string; content: string; urgent?: boolean }) => {
    const newNotice: DepartmentNotice = {
      id: `notice-${Date.now()}`,
      title,
      content,
      createdAt: new Date().toISOString(),
      author: user?.name || user?.fullName || 'Admin User',
      authorRole: user?.role === 'faculty' ? 'faculty' : 'admin',
      urgent,
    }
    setNotices((current) => [newNotice, ...current])
  }

  const deleteNoticeAsAdmin = (id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id))
  }

  const deleteNoticeAsFaculty = (id: string) => {
    const currentFacultyName = user?.name || user?.fullName || 'Faculty User'
    setNotices((current) =>
      current.filter(
        (notice) =>
          !(
            notice.id === id &&
            notice.authorRole === 'faculty' &&
            notice.author === currentFacultyName
          ),
      ),
    )
  }

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const requiredRole = getRequiredRole(path)
    let nextPath: RoutePath | null = null
    let shouldShowExpiredNotice = false

    if (requiredRole && (!isAuthenticated || !user)) {
      const token = localStorage.getItem('auth_token')
      const expiresAt = Number(localStorage.getItem('auth_expires_at') ?? '0')
      if (token && expiresAt > 0 && Date.now() > expiresAt) {
        shouldShowExpiredNotice = true
      }
      nextPath = roleLoginRoute[requiredRole]
    }

    if (!nextPath && requiredRole && user && user.role !== requiredRole) {
      nextPath = roleHomeRoute[user.role]
    }

    if (!nextPath && isAuthenticated && user && (path === '/student_login' || path === '/faculty_login' || path === '/admin_login')) {
      nextPath = roleHomeRoute[user.role]
    }

    if (nextPath && path !== nextPath) {
      if (shouldShowExpiredNotice) {
        window.setTimeout(() => {
          setSessionNotice('Session expired. Please login again.')
        }, 0)
      }
      window.history.replaceState({}, '', nextPath)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [path, isAuthenticated, user, isAuthLoading])

  const isAuthRoute =
    path === '/' ||
    path === '/student_login' ||
    path === '/student_register' ||
    path === '/faculty_login' ||
    path === '/admin_login' ||
    path === '/forgot_password' ||
    path === '/reset_password'

  return (
    <div className={isAuthRoute ? 'app-shell auth-shell' : 'app-shell'}>
      {isAuthRoute && path !== '/' ? (
        <div className="auth-top-brand">
          <BrandIdentity />
        </div>
      ) : null}

      {sessionNotice ? (
        <div className="app-session-notice" role="alert">
          <span className="material-symbols-outlined">info</span>
          <p>{sessionNotice}</p>
        </div>
      ) : null}

      <div className="background-pattern" aria-hidden="true">
        <div className="orb orb-top" />
        <div className="orb orb-bottom" />
      </div>

      {path === '/student_login' ? (
        <StudentLoginScreen
          onBack={() => navigate('/')}
          onRegister={() => navigate('/student_register')}
          onLogin={() => navigate('/student_dashboard')}
          onForgotPassword={() => navigate('/forgot_password')}
        />
      ) : null}

      {path === '/student_register' ? <StudentRegisterScreen onLogin={() => navigate('/student_login')} /> : null}

      {path === '/faculty_login' ? <FacultyLoginScreen onLogin={() => navigate('/faculty_dashboard')} /> : null}

      {path === '/admin_login' ? <AdminLoginScreen onLogin={() => navigate('/admin_dashboard')} /> : null}

      {path === '/admin_dashboard' ? (
        <AdminDashboardScreen
          onAddFaculty={() => navigate('/admin_faculty_accounts')}
          onAssignSubjects={() => navigate('/admin_assign_subjects')}
          onStudentAccounts={() => navigate('/admin_student_accounts')}
          onEnrollStudents={() => navigate('/admin_enroll_students')}
          onCirculars={() => navigate('/admin_circulars')}
          onReviewUploads={() => navigate('/admin_review_uploads')}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/admin_faculty_accounts' ? (
        <AdminFacultyAccountsScreen
          onBackDashboard={() => navigate('/admin_dashboard')}
          onAssignSubjects={() => navigate('/admin_assign_subjects')}
          onCirculars={() => navigate('/admin_circulars')}
          onViewFacultyDetails={() => navigate('/admin_faculty_details')}
        />
      ) : null}

      {path === '/admin_assign_subjects' ? (
        <AdminAssignSubjectsScreen
          onBackDashboard={() => navigate('/admin_dashboard')}
          onFacultyAccounts={() => navigate('/admin_faculty_accounts')}
          onCirculars={() => navigate('/admin_circulars')}
        />
      ) : null}

      {path === '/admin_student_accounts' ? (
        <AdminStudentAccountsScreen
          onBackDashboard={() => navigate('/admin_dashboard')}
          onFacultyAccounts={() => navigate('/admin_faculty_accounts')}
          onAssignSubjects={() => navigate('/admin_assign_subjects')}
          onCirculars={() => navigate('/admin_circulars')}
          onEnrollStudents={() => navigate('/admin_enroll_students')}
          onViewStudentDetails={() => navigate('/admin_student_details')}
        />
      ) : null}

      {path === '/admin_circulars' ? (
        <AdminCircularsScreen
          notices={notices}
          onCreateNotice={createNotice}
          onDeleteNotice={deleteNoticeAsAdmin}
          onBackDashboard={() => navigate('/admin_dashboard')}
          onFacultyAccounts={() => navigate('/admin_faculty_accounts')}
          onAssignSubjects={() => navigate('/admin_assign_subjects')}
        />
      ) : null}

      {path === '/admin_enroll_students' ? (
        <AdminEnrollStudentsScreen
          onBackDashboard={() => navigate('/admin_dashboard')}
          onBackToAccounts={() => navigate('/admin_student_accounts')}
        />
      ) : null}

      {path === '/admin_review_uploads' ? (
        <AdminReviewUploadsScreen
          onBackDashboard={() => navigate('/admin_dashboard')}
          onFacultyAccounts={() => navigate('/admin_faculty_accounts')}
          onAssignSubjects={() => navigate('/admin_assign_subjects')}
          onCirculars={() => navigate('/admin_circulars')}
        />
      ) : null}

      {path === '/admin_student_details' ? (
        <AdminStudentDetailsScreen onBack={() => navigate('/admin_student_accounts')} />
      ) : null}

      {path === '/admin_faculty_details' ? (
        <AdminFacultyDetailsScreen onBack={() => navigate('/admin_faculty_accounts')} />
      ) : null}

      {path === '/forgot_password' ? (
        <ForgotPasswordScreen
          onBack={() => navigate('/student_login')}
          onResetPassword={() => navigate('/reset_password')}
        />
      ) : null}

      {path === '/reset_password' ? (
        <ResetPasswordScreen
          onBack={() => navigate('/forgot_password')}
          onLogin={() => navigate('/student_login')}
        />
      ) : null}

      {path === '/faculty_dashboard' ? (
        <FacultyDashboardScreen
          onViewAllVerification={() => navigate('/faculty_verification')}
          onUploadTextbook={() => navigate('/faculty_textbook_upload')}
          onCreateAssignment={() => navigate('/faculty_create_assignment')}
          onViewAssignment={() => navigate('/faculty_assignment_submissions')}
          notices={notices}
          onCreateNotice={createNotice}
          onDeleteOwnNotice={deleteNoticeAsFaculty}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/faculty_verification' ? (
        <FacultyVerificationScreen
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/faculty_textbook_upload' ? (
        <FacultyTextbookUploadScreen
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/faculty_create_assignment' ? (
        <FacultyCreateAssignmentScreen onBackToDashboard={() => navigate('/faculty_dashboard')} />
      ) : null}

      {path === '/faculty_assignment_submissions' ? (
        <FacultyAssignmentSubmissionsScreen
          onGrade={() => navigate('/faculty_grade_submission')}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/faculty_grade_submission' ? <FacultyGradeSubmissionScreen /> : null}

      {path === '/student_dashboard' ? (
        <StudentDashboardScreen
          onViewBrief={() => navigate('/assignment_review')}
          onViewResult={() => navigate('/assignment_result')}
          onUnofficialNotes={() => navigate('/unofficial_notes')}
          onSearchResources={() => navigate('/search_results')}
          onBrowseRepository={() => navigate('/repository')}
          notices={notices}
          currentPath={path}
          onNavigate={navigate}
          onLogout={async () => {
            await logout()
            navigate('/')
          }}
        />
      ) : null}

      {path === '/search_results' ? <SearchResultsScreen onBackDashboard={() => navigate('/student_dashboard')} /> : null}

      {path === '/repository' ? <StudentRepositoryScreen onBackDashboard={() => navigate('/student_dashboard')} /> : null}

      {path === '/assignment_review' ? (
        <AssignmentReviewScreen onBackToDashboard={() => navigate('/student_dashboard')} />
      ) : null}

      {path === '/assignment_result' ? (
        <AssignmentResultScreen onBackToDashboard={() => navigate('/student_dashboard')} />
      ) : null}

      {path === '/unofficial_notes' ? <UnofficialNotesScreen /> : null}

      {path === '/' ? (
        <HomeScreen
          onStudentLogin={() => navigate('/student_login')}
          onFacultyLogin={() => navigate('/faculty_login')}
        />
      ) : null}
    </div>
  )
}

export default App
