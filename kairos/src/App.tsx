import './App.css'

const links = [
  { label: 'Help Center', href: '#' },
  { label: 'Support', href: '#' },
]

function App() {
  return (
    <>
      <div className="background-pattern" aria-hidden="true">
        <div className="orb orb-top" />
        <div className="orb orb-bottom" />
      </div>

      <main className="auth-card" aria-label="Department Academic Repository login">
        <div className="top-accent" />

        <section className="card-content">
          <div className="logo-shell" aria-hidden="true">
            <span className="material-symbols-outlined icon-school">school</span>
          </div>

          <h1>Department Academic Repository</h1>
          <p className="subtitle">Digital Learning &amp; Resource Portal</p>

          <div className="action-group">
            <button type="button" className="login-button">
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

export default App
