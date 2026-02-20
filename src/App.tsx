import { useEffect, useState } from 'react'
import './App.css'

type RoutePath =
  | '/'
  | '/student_login'
  | '/student_register'
  | '/faculty_login'
  | '/student_dashboard'

const links = [
  { label: 'Help Center', href: '#' },
  { label: 'Support', href: '#' },
]

function normalizePath(pathname: string): RoutePath {
  if (pathname === '/student_login' || pathname === '/login') {
    return '/student_login'
  }

  if (pathname === '/student_register' || pathname === '/register') {
    return '/student_register'
  }

  if (pathname === '/faculty_login') {
    return '/faculty_login'
  }

  if (pathname === '/student_dashboard' || pathname === '/dashboard') {
    return '/student_dashboard'
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
            <a href="#" className="admin-link">
              Admin Login
            </a>

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

function FacultyLoginScreen() {
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

          <form className="student-form faculty-form" onSubmit={(event) => event.preventDefault()}>
            <div className="field-group">
              <label htmlFor="facultyEmail">Faculty Email</label>
              <input id="facultyEmail" name="facultyEmail" type="email" placeholder="faculty@college.edu" required />
            </div>

            <div className="field-group">
              <label htmlFor="facultyPassword">Password</label>
              <div className="password-wrap">
                <input
                  id="facultyPassword"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
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

function StudentDashboardScreen() {
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
              <label htmlFor="course">Course</label>
              <select id="course" defaultValue="B.Tech Computer Science">
                <option>B.Tech Computer Science</option>
                <option>B.Sc Mathematics</option>
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="sem">Semester</label>
              <select id="sem" defaultValue="Semester 5">
                <option>Semester 5</option>
                <option>Semester 6</option>
              </select>
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
              <button type="button" className="dashboard-tab">
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
                  <th>Status</th>
                  <th className="align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Memory Management Overview</td>
                  <td>Chapter 4</td>
                  <td className="muted">Dr. Robert Wilson</td>
                  <td className="muted">Oct 12, 2023</td>
                  <td>
                    <span className="dashboard-status dashboard-status-verified">Verified</span>
                  </td>
                  <td className="align-right">
                    <button type="button" className="dashboard-btn-primary dashboard-btn-small">
                      Download
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>Process Synchronization</td>
                  <td>Chapter 3</td>
                  <td className="muted">Dr. Robert Wilson</td>
                  <td className="muted">Oct 05, 2023</td>
                  <td>
                    <span className="dashboard-status dashboard-status-pending">Pending</span>
                  </td>
                  <td className="align-right">
                    <button type="button" className="dashboard-btn-primary dashboard-btn-small">
                      Download
                    </button>
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
                <button type="button" className="dashboard-btn-primary dashboard-btn-small">
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
                <button type="button" className="dashboard-btn-secondary dashboard-btn-small">
                  Review
                </button>
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
                <button type="button" className="dashboard-btn-secondary dashboard-btn-small">
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
    path === '/' || path === '/student_login' || path === '/student_register' || path === '/faculty_login'

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

      {path === '/faculty_login' ? <FacultyLoginScreen /> : null}

      {path === '/student_dashboard' ? <StudentDashboardScreen /> : null}

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
