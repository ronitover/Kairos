import { useEffect, useState } from 'react'
import './App.css'

type RoutePath = '/' | '/student_login' | '/student_register'

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

  return '/'
}

function HomeScreen({ onStudentLogin }: { onStudentLogin: () => void }) {
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

            <button type="button" className="login-button">
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

function StudentLoginScreen({ onBack, onRegister }: { onBack: () => void; onRegister: () => void }) {
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

          <form className="student-form" onSubmit={(event) => event.preventDefault()}>
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
              <button type="button" className="student-secondary-btn" onClick={onRegister}>
                Register
              </button>
            </div>
          </form>

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

  return (
    <>
      <div className="background-pattern" aria-hidden="true">
        <div className="orb orb-top" />
        <div className="orb orb-bottom" />
      </div>

      {path === '/student_login' ? (
        <StudentLoginScreen onBack={() => navigate('/')} onRegister={() => navigate('/student_register')} />
      ) : null}

      {path === '/student_register' ? <StudentRegisterScreen onLogin={() => navigate('/student_login')} /> : null}

      {path === '/' ? <HomeScreen onStudentLogin={() => navigate('/student_login')} /> : null}
    </>
  )
}

export default App
