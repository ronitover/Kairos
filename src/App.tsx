import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import './App.css'

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
  | '/faculty_dashboard'
  | '/faculty_verification'
  | '/faculty_textbook_upload'
  | '/faculty_create_assignment'
  | '/faculty_assignment_submissions'
  | '/faculty_grade_submission'
  | '/student_dashboard'
  | '/assignment_review'
  | '/assignment_result'
  | '/unofficial_notes'

const links = [
  { label: 'Help Center', href: '#' },
  { label: 'Support', href: '#' },
]

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
  onAdminLogin,
}: {
  onStudentLogin: () => void
  onFacultyLogin: () => void
  onAdminLogin: () => void
}) {
  return (
    <>
      <main className="auth-card" aria-label="Department Academic Repository login">
        <div className="top-accent" />

        <section className="card-content">
          <div className="logo-shell" aria-hidden="true">
            <span className="material-symbols-outlined icon-school">school</span>
          </div>

          <h1 className="home-title">Department Academic Repository</h1>
          <p className="subtitle">Digital Learning &amp; Resource Portal</p>

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
            <button type="button" className="admin-link admin-button" onClick={onAdminLogin}>
              Admin Login
            </button>

            <nav className="help-nav" aria-label="Help and support links">
              {links.map((link, index) => (
                <div key={link.label} className="help-link-group">
                  <a href={link.href}>{link.label}</a>
                  {index < links.length - 1 ? <span aria-hidden="true">•</span> : null}
                </div>
              ))}
            </nav>
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
}: {
  onBack: () => void
  onRegister: () => void
  onLogin: () => void
}) {
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

          <form
            className="student-form"
            onSubmit={(event) => {
              event.preventDefault()
              onLogin()
            }}
          >
            <div className="field-group">
              <label htmlFor="email">Educational Email</label>
              <input id="email" type="email" placeholder="name@college.edu" />
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrap">
                <input id="password" type="password" placeholder="••••••••" />
                <button type="button" className="password-toggle" aria-label="Toggle password visibility">
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              </div>
              <p className="field-help">Use your official college credentials</p>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn">
                Login
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
            <a href="#">Forgot Password?</a>
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

        <form className="register-form" onSubmit={(event) => event.preventDefault()}>
          <div className="field-group">
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" name="fullName" type="text" placeholder="Enter your full name" />
          </div>

          <div className="field-group">
            <label htmlFor="usn">USN (Unique Student Number)</label>
            <input id="usn" name="usn" type="text" placeholder="e.g. 1US20CS001" />
          </div>

          <div className="register-grid-two">
            <div className="field-group">
              <label htmlFor="programme">Programme</label>
              <select id="programme" name="programme" defaultValue="">
                <option value="">Select Programme</option>
                <option value="be">B.E. / B.Tech</option>
                <option value="mtech">M.Tech</option>
                <option value="mca">MCA</option>
                <option value="mba">MBA</option>
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="semester">Semester</label>
              <select id="semester" name="semester" defaultValue="">
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
            <input id="registerEmail" name="email" type="email" placeholder="student@university.edu" />
            <p className="register-helper">Use your official college email</p>
          </div>

          <div className="register-grid-two register-password-grid">
            <div className="field-group">
              <label htmlFor="createPassword">Create Password</label>
              <input id="createPassword" name="password" type="password" />
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" />
            </div>
          </div>

          <div className="register-actions">
            <button type="submit" className="student-primary-btn">
              Create Account
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

          <form
            className="student-form faculty-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              onLogin()
            }}
          >
            <div className="field-group">
              <label htmlFor="facultyEmail">Faculty Email</label>
              <input id="facultyEmail" name="facultyEmail" type="email" placeholder="faculty@college.edu" />
            </div>

            <div className="field-group">
              <label htmlFor="facultyPassword">Password</label>
              <div className="password-wrap">
                <input
                  id="facultyPassword"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                />
                <button type="button" className="password-toggle" aria-label="Toggle password visibility">
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              </div>
              <p className="field-help">Contact administrator if you do not have credentials.</p>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn">
                Login
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

          <form
            className="student-form faculty-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              onLogin()
            }}
          >
            <div className="field-group">
              <label htmlFor="adminEmail">Admin Email</label>
              <input id="adminEmail" name="adminEmail" type="email" placeholder="admin@domain.com" />
            </div>

            <div className="field-group">
              <label htmlFor="adminPassword">Password</label>
              <div className="password-wrap">
                <input id="adminPassword" name="password" type="password" placeholder="••••••••" />
                <button type="button" className="password-toggle" aria-label="Toggle password visibility">
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              </div>
              <p className="field-help">Super admin credentials required.</p>
            </div>

            <div className="student-actions">
              <button type="submit" className="student-primary-btn">
                Login
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
}: {
  active: 'dashboard' | 'faculty' | 'subjects'
  onNavigateDashboard: () => void
  onNavigateFacultyAccounts: () => void
  onNavigateAssignSubjects: () => void
}) {
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
              <p>Admin User</p>
              <p>Super Administrator</p>
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
}: {
  onAddFaculty: () => void
  onAssignSubjects: () => void
  onStudentAccounts: () => void
}) {
  return (
    <div className="admin-page" aria-label="Global admin dashboard">
      <AdminHeader
        active="dashboard"
        onNavigateDashboard={() => {}}
        onNavigateFacultyAccounts={onAddFaculty}
        onNavigateAssignSubjects={onAssignSubjects}
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
            <button type="button">
              <span className="material-symbols-outlined">account_tree</span>
              Manage Programmes
            </button>
            <button type="button" onClick={onStudentAccounts}>
              <span className="material-symbols-outlined">school</span>
              Student Accounts
            </button>
            <button type="button">
              <span className="material-symbols-outlined">monitoring</span>
              System Reports
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

      <AdminFooter />
    </div>
  )
}

function AdminStudentAccountsScreen({
  onBackDashboard,
  onFacultyAccounts,
  onAssignSubjects,
}: {
  onBackDashboard: () => void
  onFacultyAccounts: () => void
  onAssignSubjects: () => void
}) {
  return (
    <div className="admin-page" aria-label="Student accounts management">
      <AdminHeader
        active="dashboard"
        onNavigateDashboard={onBackDashboard}
        onNavigateFacultyAccounts={onFacultyAccounts}
        onNavigateAssignSubjects={onAssignSubjects}
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
                      <button type="button" className="view" aria-label="View details">
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
                      <button type="button" className="view" aria-label="View details">
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
}: {
  onBackDashboard: () => void
  onAssignSubjects: () => void
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
                      <button type="button" aria-label="Edit faculty">
                        <span className="material-symbols-outlined">edit</span>
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
                      <button type="button" aria-label="Edit faculty">
                        <span className="material-symbols-outlined">edit</span>
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
}: {
  onBackDashboard: () => void
  onFacultyAccounts: () => void
}) {
  const [selectedSubjectCodes, setSelectedSubjectCodes] = useState<string[]>(['CS-401', 'CS-405'])

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
              <button type="button">
                <span className="material-symbols-outlined">assignment_turned_in</span>
                Assign Selected Subjects
              </button>
              <p>
                <span className="material-symbols-outlined">info</span>
                Faculty can manage only assigned subjects.
              </p>
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
}: {
  onViewAllVerification: () => void
  onUploadTextbook: () => void
  onCreateAssignment: () => void
  onViewAssignment: () => void
}) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  return (
    <div className="faculty-page" aria-label="Faculty management dashboard">
      <header className="faculty-header">
        <div className="faculty-container faculty-header-row">
          <div className="faculty-brand">
            <div className="faculty-brand-icon">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <h1>Faculty Dashboard</h1>
          </div>
          <div className="dashboard-user">
            <div className="dashboard-user-info">
              <p>Dr. Sarah Jenkins</p>
              <p>Senior Professor • CS Dept</p>
            </div>
            <div className="dashboard-avatar">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
            <span className="material-symbols-outlined dashboard-chevron">expand_more</span>
          </div>
        </div>
        <div className="faculty-header-accent" />
      </header>

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
                onClick={() => setIsUploadModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="faculty-modal-form" onSubmit={(event) => event.preventDefault()}>
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
                  <input type="file" />
                  <div>
                    <span className="material-symbols-outlined">cloud_upload</span>
                  </div>
                  <p>Click to upload or drag and drop</p>
                  <p>PDF, DOCX, PPTX, JPG or PNG (Max 25MB)</p>
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

function StudentDashboardScreen({
  onViewBrief,
  onViewResult,
  onUnofficialNotes,
}: {
  onViewBrief: () => void
  onViewResult: () => void
  onUnofficialNotes: () => void
}) {
  return (
    <div className="dashboard-page" aria-label="Student dashboard">
      <header className="dashboard-header">
        <div className="dashboard-container dashboard-header-row">
          <h1>Student Dashboard</h1>
          <div className="dashboard-user">
            <div className="dashboard-user-info">
              <p>Alex Thompson</p>
              <p>Semester 5 • Computer Science</p>
            </div>
            <div className="dashboard-avatar">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
            <span className="material-symbols-outlined dashboard-chevron">expand_more</span>
          </div>
        </div>
        <div className="dashboard-header-accent" />
      </header>

      <main className="dashboard-container dashboard-main">
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

            <button type="button" className="dashboard-upload-btn">
              <span className="material-symbols-outlined">upload</span>
              Upload Notes
            </button>
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
                      <button type="button" className="dashboard-table-icon-btn" aria-label="View note">
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
                      <button type="button" className="dashboard-table-icon-btn" aria-label="View note">
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
                <div>
                  <h3>Implement Multi-threaded Scheduler</h3>
                  <p>Subject: CS501 • 15th Nov 2023</p>
                </div>
              </div>
              <div className="dashboard-assignment-right">
                <div className="dashboard-assignment-meta">
                  <p className="status-warning-text">Due in 2 Days</p>
                  <span className="pill">Not Submitted</span>
                </div>
                <button type="button" className="dashboard-btn-primary dashboard-btn-small" onClick={onViewBrief}>
                  View Brief
                </button>
              </div>
            </article>

            <article className="dashboard-assignment-row">
              <div className="dashboard-assignment-left">
                <div className="dashboard-assignment-icon info">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div>
                  <h3>Memory Mapping Lab Report</h3>
                  <p>Subject: CS501 • 01st Nov 2023</p>
                </div>
              </div>
              <div className="dashboard-assignment-right">
                <div className="dashboard-assignment-meta">
                  <p className="status-success-text">Completed</p>
                  <span className="pill success">Submitted</span>
                </div>
              </div>
            </article>

            <article className="dashboard-assignment-row">
              <div className="dashboard-assignment-left">
                <div className="dashboard-assignment-icon success">
                  <span className="material-symbols-outlined">grade</span>
                </div>
                <div>
                  <h3>CPU Scheduling Quiz</h3>
                  <p>Subject: CS501 • 25th Oct 2023</p>
                </div>
              </div>
              <div className="dashboard-assignment-right">
                <div className="dashboard-assignment-meta">
                  <p className="grade-text">Grade: A+</p>
                  <span className="pill info">Graded</span>
                </div>
                <button type="button" className="dashboard-btn-secondary dashboard-btn-small" onClick={onViewResult}>
                  Details
                </button>
              </div>
            </article>
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

function FacultyVerificationScreen() {
  return (
    <div className="faculty-page" aria-label="Student notes verification panel">
      <header className="faculty-header">
        <div className="faculty-container faculty-header-row">
          <div className="faculty-brand">
            <div className="faculty-brand-icon">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <div>
              <h1 className="faculty-portal-title">University Portal</h1>
              <p className="faculty-portal-subtitle">Faculty Administration</p>
            </div>
          </div>
          <div className="dashboard-user">
            <div className="dashboard-user-info">
              <p>Dr. Sarah Jenkins</p>
              <p>Senior Professor • CS Dept</p>
            </div>
            <div className="dashboard-avatar">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
          </div>
        </div>
      </header>

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
                    <span className="faculty-status-badge pending">Pending</span>
                  </td>
                  <td className="align-right">
                    <div className="faculty-row-actions">
                      <button type="button" className="faculty-preview-btn">
                        Preview
                      </button>
                      <button type="button" className="faculty-approve-btn">
                        Approve
                      </button>
                      <button type="button" className="faculty-reject-btn">
                        Reject
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
                    <span className="faculty-status-badge pending">Pending</span>
                  </td>
                  <td className="align-right">
                    <div className="faculty-row-actions">
                      <button type="button" className="faculty-preview-btn">
                        Preview
                      </button>
                      <button type="button" className="faculty-approve-btn">
                        Approve
                      </button>
                      <button type="button" className="faculty-reject-btn">
                        Reject
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
    </div>
  )
}

function FacultyTextbookUploadScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="textbook-page" aria-label="Textbook management panel">
      {isModalOpen ? <div className="textbook-modal-overlay" /> : null}

      <header className="faculty-header textbook-header">
        <div className="faculty-container faculty-header-row">
          <div className="faculty-brand">
            <div className="faculty-brand-icon">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <div>
              <h1 className="faculty-portal-title">University Portal</h1>
              <p className="faculty-portal-subtitle">Faculty Administration</p>
            </div>
          </div>
          <div className="dashboard-user">
            <div className="dashboard-user-info">
              <p>Dr. Sarah Jenkins</p>
              <p>Senior Professor • CS Dept</p>
            </div>
            <div className="dashboard-avatar">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
          </div>
        </div>
      </header>

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
            <form className="textbook-modal-form" onSubmit={(event) => event.preventDefault()}>
              <div>
                <label htmlFor="book-title">Book Title</label>
                <input id="book-title" type="text" placeholder="e.g. Modern Operating Systems" />
              </div>
              <div className="textbook-modal-grid">
                <div>
                  <label htmlFor="author">Author Name</label>
                  <input id="author" type="text" placeholder="e.g. Andrew S. Tanenbaum" />
                </div>
                <div>
                  <label htmlFor="edition">
                    Edition <span className="field-optional">(Optional)</span>
                  </label>
                  <select id="edition" defaultValue="">
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
                <label>Book Document (PDF)</label>
                <label className="textbook-file-dropzone">
                  <input type="file" />
                  <div>
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                  <p>Click or drag PDF to upload</p>
                  <p>Files will be encrypted and stored securely</p>
                </label>
                <p className="textbook-file-help">Maximum file size: 50MB. Only PDF format supported.</p>
              </div>
              <div className="textbook-modal-actions">
                <button type="submit" className="textbook-publish-btn">
                  Upload &amp; Publish
                </button>
                <button type="button" className="textbook-cancel-btn" onClick={() => setIsModalOpen(false)}>
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

function FacultyCreateAssignmentScreen() {
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
            <a href="#">Dashboard</a>
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

        <form className="create-assignment-form" onSubmit={(event) => event.preventDefault()}>
          <section className="create-assignment-card">
            <div className="create-assignment-section-title">
              <span className="material-symbols-outlined">info</span>
              <h3>General Info</h3>
            </div>
            <div className="create-assignment-fields">
              <div>
                <label htmlFor="assignment-title">Assignment Title</label>
                <input id="assignment-title" type="text" placeholder="e.g., Introduction to Algorithms" />
              </div>
              <div>
                <label htmlFor="assignment-instructions">Instructions</label>
                <textarea
                  id="assignment-instructions"
                  rows={6}
                  placeholder="Provide detailed steps for students..."
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
                  <input id="assignment-marks" type="number" placeholder="100" />
                  <span>pts</span>
                </div>
              </div>
              <div>
                <label htmlFor="assignment-due">Due Date &amp; Time</label>
                <input id="assignment-due" type="datetime-local" />
              </div>
            </div>
          </section>

          <section className="create-assignment-card">
            <div className="create-assignment-section-title">
              <span className="material-symbols-outlined">attach_file</span>
              <h3>Resources</h3>
            </div>
            <label className="create-assignment-dropzone">
              <input type="file" />
              <div>
                <span className="material-symbols-outlined">upload_file</span>
              </div>
              <p>
                <span>Click to upload</span> or drag and drop reference files
              </p>
              <p>PDF, DOCX, or ZIP (max. 50MB)</p>
            </label>
          </section>

          <section className="create-assignment-card">
            <div className="create-assignment-toggle-row">
              <div>
                <h3>Allow Late Submission</h3>
                <p>Students can submit after the deadline with a penalty</p>
              </div>
              <label className="create-assignment-switch">
                <input type="checkbox" />
                <span />
              </label>
            </div>
          </section>

          <div className="create-assignment-actions">
            <button type="submit" className="create-assignment-publish">
              <span className="material-symbols-outlined">publish</span>
              Publish Assignment
            </button>
            <div>
              <span className="material-symbols-outlined">info</span>
              <p>This assignment will be visible to students under this subject.</p>
            </div>
          </div>
        </form>
      </main>

      <footer className="create-assignment-footer">
        <p>© 2024 University Digital Repository Platform. All faculty rights reserved.</p>
      </footer>
    </div>
  )
}

function FacultyAssignmentSubmissionsScreen({ onGrade }: { onGrade: () => void }) {
  return (
    <div className="faculty-submissions-page" aria-label="Assignment submissions overview">
      <header className="faculty-submissions-header">
        <div className="faculty-submissions-container faculty-submissions-header-row">
          <div className="faculty-submissions-brand">
            <span className="material-symbols-outlined">school</span>
            <h2>EduRepo</h2>
          </div>
          <nav className="faculty-submissions-nav">
            <a href="#">Dashboard</a>
            <a href="#" className="active">
              Courses
            </a>
            <a href="#">Faculty Docs</a>
            <a href="#">Reports</a>
          </nav>
          <div className="faculty-submissions-user">
            <button type="button" className="faculty-submissions-notify">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="dashboard-avatar">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
          </div>
        </div>
      </header>

      <main className="faculty-submissions-container faculty-submissions-main">
        <div className="faculty-submissions-top">
          <nav className="faculty-submissions-breadcrumb">
            <a href="#">Courses</a>
            <span className="material-symbols-outlined">chevron_right</span>
            <a href="#">CS301: Computer Architecture</a>
            <span className="material-symbols-outlined">chevron_right</span>
            <span>Submissions</span>
          </nav>
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
    const newNotes: UploadedNote[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      title: file.name,
      uploadedOn: formatUploadDate(now),
      fileInfo: `${file.name.split('.').pop()?.toUpperCase() || 'FILE'} • ${formatFileSize(file.size)}`,
      status: 'pending',
      canDownload: true,
      downloadUrl: URL.createObjectURL(file),
      fileName: file.name,
    }))

    setUploadedNotes((current) => [...newNotes, ...current])
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
              multiple
              className="visually-hidden-input"
              onChange={handleFilesSelected}
            />
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

function AssignmentReviewScreen() {
  return (
    <div className="assignment-page" aria-label="Assignment submission details">
      <header className="assignment-header">
        <div className="dashboard-container assignment-header-content">
          <nav className="assignment-breadcrumb" aria-label="Breadcrumb">
            <a href="#">Assignments</a>
            <span className="material-symbols-outlined">chevron_right</span>
            <a href="#">CS501</a>
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
                <span>Not Submitted</span>
              </div>
              <div className="assignment-uploaded-item">
                <div>
                  <span className="material-symbols-outlined">database</span>
                  <p>sql_joins_solution.sql</p>
                </div>
                <button type="button" aria-label="Remove file">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <button type="button" className="assignment-dropzone">
                <span className="material-symbols-outlined">upload_file</span>
                <p>Add or create</p>
                <p>Drag and drop or click to upload</p>
              </button>

              <button type="button" className="assignment-submit-btn">
                Submit Assignment
              </button>
              <p className="assignment-note">Submission will be timestamped and logged.</p>
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

function AssignmentResultScreen() {
  return (
    <div className="assignment-page" aria-label="Submission and grade status">
      <header className="assignment-header">
        <div className="dashboard-container result-header-content">
          <nav className="assignment-breadcrumb" aria-label="Breadcrumb">
            <a href="#">Assignments</a>
            <span className="result-breadcrumb-divider">/</span>
            <a href="#">CS501</a>
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

function App() {
  const [path, setPath] = useState<RoutePath>(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const normalized = normalizePath(window.location.pathname)
    if (window.location.pathname !== normalized) {
      window.history.replaceState({}, '', normalized)
    }

    const onPopState = () => setPath(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (nextPath: RoutePath) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  const isAuthRoute =
    path === '/' ||
    path === '/student_login' ||
    path === '/student_register' ||
    path === '/faculty_login' ||
    path === '/admin_login'

  return (
    <div className={isAuthRoute ? 'app-shell auth-shell' : 'app-shell'}>
      <div className="background-pattern" aria-hidden="true">
        <div className="orb orb-top" />
        <div className="orb orb-bottom" />
      </div>

      {path === '/student_login' ? (
        <StudentLoginScreen
          onBack={() => navigate('/')}
          onRegister={() => navigate('/student_register')}
          onLogin={() => navigate('/student_dashboard')}
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
        />
      ) : null}

      {path === '/admin_faculty_accounts' ? (
        <AdminFacultyAccountsScreen
          onBackDashboard={() => navigate('/admin_dashboard')}
          onAssignSubjects={() => navigate('/admin_assign_subjects')}
        />
      ) : null}

      {path === '/admin_assign_subjects' ? (
        <AdminAssignSubjectsScreen
          onBackDashboard={() => navigate('/admin_dashboard')}
          onFacultyAccounts={() => navigate('/admin_faculty_accounts')}
        />
      ) : null}

      {path === '/admin_student_accounts' ? (
        <AdminStudentAccountsScreen
          onBackDashboard={() => navigate('/admin_dashboard')}
          onFacultyAccounts={() => navigate('/admin_faculty_accounts')}
          onAssignSubjects={() => navigate('/admin_assign_subjects')}
        />
      ) : null}

      {path === '/faculty_dashboard' ? (
        <FacultyDashboardScreen
          onViewAllVerification={() => navigate('/faculty_verification')}
          onUploadTextbook={() => navigate('/faculty_textbook_upload')}
          onCreateAssignment={() => navigate('/faculty_create_assignment')}
          onViewAssignment={() => navigate('/faculty_assignment_submissions')}
        />
      ) : null}

      {path === '/faculty_verification' ? <FacultyVerificationScreen /> : null}

      {path === '/faculty_textbook_upload' ? <FacultyTextbookUploadScreen /> : null}

      {path === '/faculty_create_assignment' ? <FacultyCreateAssignmentScreen /> : null}

      {path === '/faculty_assignment_submissions' ? (
        <FacultyAssignmentSubmissionsScreen onGrade={() => navigate('/faculty_grade_submission')} />
      ) : null}

      {path === '/faculty_grade_submission' ? <FacultyGradeSubmissionScreen /> : null}

      {path === '/student_dashboard' ? (
        <StudentDashboardScreen
          onViewBrief={() => navigate('/assignment_review')}
          onViewResult={() => navigate('/assignment_result')}
          onUnofficialNotes={() => navigate('/unofficial_notes')}
        />
      ) : null}

      {path === '/assignment_review' ? <AssignmentReviewScreen /> : null}

      {path === '/assignment_result' ? <AssignmentResultScreen /> : null}

      {path === '/unofficial_notes' ? <UnofficialNotesScreen /> : null}

      {path === '/' ? (
        <HomeScreen
          onStudentLogin={() => navigate('/student_login')}
          onFacultyLogin={() => navigate('/faculty_login')}
          onAdminLogin={() => navigate('/admin_login')}
        />
      ) : null}
    </div>
  )
}

export default App
