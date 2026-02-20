import { useEffect, useState } from 'react'
import './App.css'

type RoutePath =
  | '/'
  | '/student_login'
  | '/student_register'
  | '/faculty_login'
  | '/student_dashboard'
  | '/assignment_review'
  | '/assignment_result'
  | '/unofficial_notes'

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

  if (pathname === '/assignment_review') {
    return '/assignment_review'
  }

  if (pathname === '/assignment_result' || pathname === '/results') {
    return '/assignment_result'
  }

  if (pathname === '/unofficial_notes') {
    return '/unofficial_notes'
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

function UnofficialNotesScreen() {
  return (
    <div className="unofficial-page" aria-label="Student unofficial notes portal">
      <header className="unofficial-header">
        <div className="dashboard-container unofficial-header-row">
          <div>
            <h1>Unofficial Notes</h1>
            <div className="unofficial-header-accent" />
          </div>
          <div className="unofficial-header-right">
            <button type="button" className="dashboard-upload-btn">
              <span className="material-symbols-outlined">cloud_upload</span>
              Upload Notes
            </button>
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
                <span>3 Total</span>
              </div>

              <div className="unofficial-upload-list">
                <article className="unofficial-upload-item">
                  <div className="unofficial-upload-top">
                    <div>
                      <h3>OS - Deadlocks Short Notes</h3>
                      <p>Uploaded on Oct 24, 2023</p>
                    </div>
                    <span className="unofficial-badge verified">Verified</span>
                  </div>
                  <div className="unofficial-upload-bottom">
                    <span>PDF • 1.2 MB</span>
                    <button type="button" className="dashboard-btn-primary dashboard-btn-small">
                      <span className="material-symbols-outlined">download</span>
                      Download
                    </button>
                  </div>
                </article>

                <article className="unofficial-upload-item">
                  <div className="unofficial-upload-top">
                    <div>
                      <h3>Virtual Memory Lab Manual</h3>
                      <p>Uploaded on Oct 28, 2023</p>
                    </div>
                    <span className="unofficial-badge pending">Pending</span>
                  </div>
                  <div className="unofficial-upload-bottom">
                    <span>DOCX • 850 KB</span>
                    <button type="button" className="dashboard-btn-primary dashboard-btn-small" disabled>
                      <span className="material-symbols-outlined">download</span>
                      Download
                    </button>
                  </div>
                </article>

                <article className="unofficial-upload-item">
                  <div className="unofficial-upload-top">
                    <div>
                      <h3>Networking - OSI Model</h3>
                      <p>Uploaded on Oct 15, 2023</p>
                    </div>
                    <span className="unofficial-badge rejected">Rejected</span>
                  </div>
                  <div className="unofficial-upload-bottom">
                    <span>PDF • 3.4 MB</span>
                    <button type="button" className="dashboard-btn-primary dashboard-btn-small" disabled>
                      <span className="material-symbols-outlined">download</span>
                      Download
                    </button>
                  </div>
                </article>
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
        />
      ) : null}
    </div>
  )
}

export default App
