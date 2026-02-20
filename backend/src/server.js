import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const {
  PORT = 4000,
  CORS_ORIGIN = 'http://localhost:5173',
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} = process.env

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend/.env')
}

const app = express()
const allowedOrigins = CORS_ORIGIN.split(',').map((origin) => origin.trim())

app.use(
  cors({
    origin: allowedOrigins,
  }),
)
app.use(express.json())

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

function getRole(user) {
  const appRole = typeof user?.app_metadata?.role === 'string' ? user.app_metadata.role.toLowerCase() : null
  const userRole = typeof user?.user_metadata?.role === 'string' ? user.user_metadata.role.toLowerCase() : null

  return appRole ?? userRole
}

function normalizeString(value) {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed
}

function isValidEmail(email) {
  const normalizedEmail = normalizeString(email)
  return typeof normalizedEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
}

function validateCredentials(email, password) {
  const normalizedEmail = normalizeString(email)
  const normalizedPassword = normalizeString(password)

  if (!isValidEmail(email)) {
    return 'A valid email is required.'
  }

  if (typeof normalizedPassword !== 'string' || normalizedPassword.length < 6) {
    return 'Password must be at least 6 characters.'
  }

  return null
}

function createRoleLoginHandler(expectedRole) {
  return async (req, res) => {
    const rawEmail = req.body?.email
    const rawPassword = req.body?.password
    const email = normalizeString(rawEmail)
    const password = normalizeString(rawPassword)
    const validationError = validateCredentials(email, password)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user || !data.session) {
      return res.status(401).json({ message: error?.message ?? 'Invalid login credentials.' })
    }

    const actualRole = getRole(data.user)
    if (actualRole !== expectedRole) {
      return res.status(403).json({
        message: `This account does not have ${expectedRole.toUpperCase()} access.`,
      })
    }

    return res.json({
      message: `${expectedRole.toUpperCase()} login successful.`,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: actualRole,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    })
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/student/register', async (req, res) => {
  const fullName = normalizeString(req.body?.fullName)
  const usn = normalizeString(req.body?.usn)
  const programme = normalizeString(req.body?.programme)
  const semester = normalizeString(req.body?.semester)
  const email = normalizeString(req.body?.email)
  const password = normalizeString(req.body?.password)

  if (
    typeof fullName !== 'string' ||
    fullName.length === 0 ||
    typeof usn !== 'string' ||
    usn.length === 0 ||
    typeof programme !== 'string' ||
    programme.length === 0 ||
    typeof semester !== 'string'
  ) {
    return res.status(400).json({ message: 'Student profile fields are required.' })
  }

  const validationError = validateCredentials(email, password)
  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'student',
        fullName,
        usn,
        programme,
        semester,
      },
    },
  })

  if (error) {
    return res.status(400).json({ message: error.message })
  }

  if (!data.user) {
    return res.status(500).json({ message: 'Unable to create account.' })
  }

  return res.status(201).json({
    message:
      'Student registration successful. Check your email if confirmation is required in Supabase settings.',
    user: {
      id: data.user.id,
      email: data.user.email,
      role: getRole(data.user) ?? 'student',
    },
  })
})

app.post('/api/auth/student/login', createRoleLoginHandler('student'))
app.post('/api/auth/faculty/login', createRoleLoginHandler('faculty'))
app.post('/api/auth/admin/login', createRoleLoginHandler('admin'))

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Internal server error.' })
})

app.listen(Number(PORT), () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
