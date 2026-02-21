import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import { PassThrough } from 'node:stream'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

dotenv.config()

const {
  PORT = 4000,
  CORS_ORIGIN = 'http://localhost:5173',
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  MAX_UPLOAD_SIZE_MB = '10',
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_OAUTH_REDIRECT_URI,
  GOOGLE_OAUTH_REFRESH_TOKEN,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_DRIVE_PARENT_FOLDER_ID,
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

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(MAX_UPLOAD_SIZE_MB) * 1024 * 1024,
  },
})

let driveClient = null
let oauth2Client = null

if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REDIRECT_URI) {
  oauth2Client = new google.auth.OAuth2(
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI,
  )

  if (GOOGLE_OAUTH_REFRESH_TOKEN) {
    oauth2Client.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN })
  }

  driveClient = google.drive({ version: 'v3', auth: oauth2Client })
} else if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  driveClient = google.drive({ version: 'v3', auth })
}

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

function normalizeSemester(value, fallback = 1) {
  const raw = normalizeString(value)
  const numeric = raw ? Number(String(raw).match(/\d+/)?.[0] ?? fallback) : fallback
  if (Number.isNaN(numeric) || numeric < 1) return 1
  if (numeric > 8) return 8
  return numeric
}

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return null
  }

  const [scheme, token] = authorizationHeader.split(' ')
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null
  }

  return token.trim()
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

async function requireAuth(req, res, next) {
  const token = extractBearerToken(req.headers.authorization)
  if (!token) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header.' })
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return res.status(401).json({ message: 'Invalid or expired access token.' })
  }

  req.auth = {
    token,
    user: data.user,
    role: getRole(data.user),
  }

  next()
}

function ensureDriveConfigured(res) {
  if (!driveClient) {
    res.status(500).json({
      message:
        'Google Drive is not configured. Set OAuth env values in backend/.env.',
    })
    return false
  }

  if (oauth2Client && !oauth2Client.credentials.refresh_token && !oauth2Client.credentials.access_token) {
    res.status(400).json({
      message:
        'OAuth setup incomplete. Use GET /api/drive/oauth/url and POST /api/drive/oauth/exchange-code to obtain a refresh token.',
    })
    return false
  }

  return true
}

function mapDriveFile(file) {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
    createdTime: file.createdTime,
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink,
    parents: file.parents ?? [],
    appProperties: file.appProperties ?? {},
  }
}

function escapeDriveQueryValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function ensureDatabaseConfigured(res) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({
      message: 'Database integration requires SUPABASE_SERVICE_ROLE_KEY in backend/.env.',
    })
    return false
  }
  return true
}

async function isVerifiedNoteFile(fileId) {
  if (!fileId) return false
  const { data, error } = await adminSupabase
    .from('note_files')
    .select('id,file_url,notes!inner(status)')
    .eq('notes.status', 'verified')
    .limit(500)
  if (error) throw error
  if (!Array.isArray(data) || data.length === 0) return false
  return data.some((row) => {
    const url = String(row.file_url || '')
    return (
      url.includes(`/file/d/${fileId}`) ||
      url.includes(`id=${fileId}`) ||
      url.includes(fileId)
    )
  })
}

async function canStudentReadDriveFile(fileId, driveFile, userId) {
  const uploadedBy = driveFile?.appProperties?.uploadedBy
  if (!uploadedBy || uploadedBy === userId) {
    return true
  }

  const category = normalizeString(driveFile?.appProperties?.category)?.toLowerCase()
  if (category === 'official-note') {
    return true
  }
  if (category === 'unofficial-note') {
    return isVerifiedNoteFile(fileId)
  }

  return isVerifiedNoteFile(fileId)
}

async function getOrCreateSubjectFolder(subjectName, parentFolderId) {
  if (!subjectName) {
    return parentFolderId ?? null
  }

  const trimmedSubject = normalizeString(subjectName)
  if (!trimmedSubject) {
    return parentFolderId ?? null
  }

  const clauses = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `name = '${escapeDriveQueryValue(trimmedSubject)}'`,
  ]
  if (parentFolderId) {
    clauses.push(`'${parentFolderId}' in parents`)
  }

  const existing = await driveClient.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: clauses.join(' and '),
    pageSize: 1,
    fields: 'files(id,name,parents)',
  })

  const existingFolder = existing.data.files?.[0]
  if (existingFolder?.id) {
    return existingFolder.id
  }

  const created = await driveClient.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: trimmedSubject,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
      appProperties: {
        folderType: 'subject',
        subjectName: trimmedSubject,
      },
    },
    fields: 'id,name,parents',
  })

  return created.data.id ?? parentFolderId ?? null
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req.auth?.role
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'You are not allowed to perform this action.' })
    }
    next()
  }
}

function normalizeEventType(value) {
  const normalized = normalizeString(value)?.toLowerCase()
  if (normalized === 'assignment' || normalized === 'test' || normalized === 'holiday' || normalized === 'event') {
    return normalized
  }
  return null
}

function normalizeAudience(value) {
  const normalized = normalizeString(value)?.toLowerCase()
  if (normalized === 'students' || normalized === 'faculty' || normalized === 'both') {
    return normalized
  }
  return null
}

async function uploadToDrive({ file, userId, role, subjectName, folderId, fileName, category, metadata = {} }) {
  const effectiveParent = normalizeString(folderId) || GOOGLE_DRIVE_PARENT_FOLDER_ID
  const normalizedSubject = normalizeString(subjectName) || null
  const targetParent = await getOrCreateSubjectFolder(normalizedSubject, effectiveParent)
  const uploadName = normalizeString(fileName) || file.originalname
  const uploadCategory = normalizeString(category) || 'general'
  const mediaStream = new PassThrough()
  mediaStream.end(file.buffer)

  const created = await driveClient.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: uploadName,
      parents: targetParent ? [targetParent] : undefined,
      appProperties: {
        uploadedBy: userId,
        uploaderRole: role ?? 'unknown',
        category: uploadCategory,
        subjectName: normalizedSubject ?? '',
        ...metadata,
      },
    },
    media: {
      mimeType: file.mimetype,
      body: mediaStream,
    },
    fields:
      'id,name,mimeType,size,createdTime,webViewLink,webContentLink,parents,appProperties',
  })

  return {
    file: mapDriveFile(created.data),
    folder: {
      subjectName: normalizedSubject,
      folderId: targetParent,
    },
  }
}

async function syncStudentProfileFromUser(user) {
  const fullName = normalizeString(user?.user_metadata?.fullName || user?.user_metadata?.full_name) || 'Student'
  const usn = normalizeString(user?.user_metadata?.usn) || `TEMP-${user.id.slice(0, 8)}`
  const programme = normalizeString(user?.user_metadata?.programme) || 'Unknown Programme'
  const semester = normalizeSemester(user?.user_metadata?.semester, 1)
  const email = typeof user?.email === 'string' && user.email.trim() ? user.email.trim() : null

  const { data, error } = await adminSupabase
    .from('students')
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        usn,
        programme,
        semester,
        email,
        status: 'active',
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function syncFacultyProfileFromUser(user) {
  const name = normalizeString(user?.user_metadata?.name || user?.user_metadata?.fullName) || 'Faculty'
  const department = normalizeString(user?.user_metadata?.department) || 'Department'
  const designation = normalizeString(user?.user_metadata?.designation) || null

  const { data, error } = await adminSupabase
    .from('faculty')
    .upsert(
      {
        id: user.id,
        name,
        department,
        designation,
        status: 'active',
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function syncAdminProfileFromUser(user) {
  const name = normalizeString(user?.user_metadata?.name || user?.user_metadata?.fullName) || 'Admin'
  const role = normalizeString(user?.user_metadata?.adminRole) || 'admin'

  const { data, error } = await adminSupabase
    .from('admins')
    .upsert(
      {
        id: user.id,
        name,
        role: role === 'super_admin' ? 'super_admin' : 'admin',
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function syncRoleProfile(user, role) {
  if (role === 'student') return syncStudentProfileFromUser(user)
  if (role === 'faculty') return syncFacultyProfileFromUser(user)
  if (role === 'admin') return syncAdminProfileFromUser(user)
  return null
}

async function getRoleProfile(userId, role) {
  if (role === 'student') {
    const { data } = await adminSupabase
      .from('students')
      .select('id,full_name,usn,programme,semester,email,status,registered_at')
      .eq('id', userId)
      .maybeSingle()
    return data
  }
  if (role === 'faculty') {
    const { data } = await adminSupabase
      .from('faculty')
      .select('id,name,department,designation,status,join_date')
      .eq('id', userId)
      .maybeSingle()
    return data
  }
  if (role === 'admin') {
    const { data } = await adminSupabase
      .from('admins')
      .select('id,name,role,created_at')
      .eq('id', userId)
      .maybeSingle()
    return data
  }
  return null
}

async function getOrCreateSubjectByName(subjectName, extra = {}) {
  const normalized = normalizeString(subjectName)
  if (!normalized) {
    throw new Error('subjectName is required.')
  }

  const { data: existingByName, error: findErr } = await adminSupabase
    .from('subjects')
    .select('*')
    .eq('name', normalized)
    .limit(1)
    .maybeSingle()
  if (findErr) throw findErr
  if (existingByName) return existingByName

  const sanitizedCode = normalized
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 20)
  const uniqueCode = `${sanitizedCode || 'SUBJECT'}_${Date.now().toString().slice(-6)}`

  const { data, error } = await adminSupabase
    .from('subjects')
    .insert({
      code: extra.code || uniqueCode,
      name: normalized,
      programme: extra.programme || 'General',
      semester: normalizeSemester(extra.semester, 1),
      description: extra.description || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function getSubjectById(subjectId) {
  const id = normalizeString(subjectId)
  if (!id) return null

  const { data, error } = await adminSupabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

async function resolveSubjectName({ subjectId, subjectName }) {
  const normalizedId = normalizeString(subjectId)
  if (normalizedId) {
    const subject = await getSubjectById(normalizedId)
    if (!subject) {
      throw new Error('Invalid subjectId. Subject not found.')
    }
    return { subjectId: subject.id, subjectName: subject.name }
  }

  const normalizedName = normalizeString(subjectName)
  if (!normalizedName) {
    return { subjectId: null, subjectName: null }
  }

  const subject = await getOrCreateSubjectByName(normalizedName)
  return { subjectId: subject.id, subjectName: subject.name }
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

    await syncRoleProfile(data.user, actualRole)

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
  res.json({
    ok: true,
    env: !SUPABASE_URL || !SUPABASE_ANON_KEY ? 'missing_required_env' : 'configured',
  })
})

app.get('/api/me', requireAuth, async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return
  const { user, role } = req.auth
  await syncRoleProfile(user, role)
  const profile = await getRoleProfile(user.id, role)

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      role,
      appMetadata: user.app_metadata ?? {},
      userMetadata: user.user_metadata ?? {},
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    },
    profile,
  })
})

app.get('/api/drive/oauth/url', (_req, res) => {
  if (!oauth2Client) {
    return res.status(400).json({
      message:
        'OAuth client is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI.',
    })
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
  })

  return res.json({ url })
})

app.get('/api/drive/oauth/callback', (req, res) => {
  const code = normalizeString(req.query?.code)
  if (!code) {
    return res.status(400).json({ message: 'Missing "code" query parameter.' })
  }

  return res.json({
    message:
      'Authorization code received. Send this code to POST /api/drive/oauth/exchange-code.',
    code,
  })
})

app.post('/api/drive/oauth/exchange-code', async (req, res) => {
  if (!oauth2Client) {
    return res.status(400).json({
      message:
        'OAuth client is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI.',
    })
  }

  const code = normalizeString(req.body?.code)
  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required.' })
  }

  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  return res.json({
    message:
      'OAuth code exchange successful. Save refreshToken in backend/.env as GOOGLE_OAUTH_REFRESH_TOKEN and restart backend.',
    refreshToken: tokens.refresh_token ?? null,
    accessToken: tokens.access_token ?? null,
    expiryDate: tokens.expiry_date ?? null,
  })
})

app.post('/api/files/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!ensureDriveConfigured(res) || !ensureDatabaseConfigured(res)) {
    return
  }

  if (!req.file) {
    return res.status(400).json({ message: 'File is required. Use multipart/form-data with key "file".' })
  }

  const { user, role } = req.auth
  const resolvedSubject = await resolveSubjectName({
    subjectId: req.body?.subjectId,
    subjectName: req.body?.subjectName,
  })
  const uploaded = await uploadToDrive({
    file: req.file,
    userId: user.id,
    role,
    subjectName: resolvedSubject.subjectName,
    folderId: req.body?.folderId,
    fileName: req.body?.fileName,
    category: req.body?.category,
  })

  return res.status(201).json({
    message: 'File uploaded to Google Drive successfully.',
    file: uploaded.file,
    folder: uploaded.folder,
    subject: resolvedSubject,
  })
})

app.get('/api/files', requireAuth, async (req, res) => {
  if (!ensureDriveConfigured(res)) {
    return
  }

  const { user, role } = req.auth
  const canReadAll = role === 'admin' || role === 'faculty'
  const subjectName = normalizeString(req.query?.subjectName)
  const category = normalizeString(req.query?.category)
  const uploadedByParam = normalizeString(req.query?.uploadedBy)

  const clauses = ["trashed = false"]
  clauses.push("appProperties has { key='uploadedBy' }")
  if (subjectName) {
    clauses.push(`appProperties has { key='subjectName' and value='${escapeDriveQueryValue(subjectName)}' }`)
  }
  if (category) {
    clauses.push(`appProperties has { key='category' and value='${escapeDriveQueryValue(category)}' }`)
  }
  if (canReadAll && uploadedByParam) {
    clauses.push(`appProperties has { key='uploadedBy' and value='${escapeDriveQueryValue(uploadedByParam)}' }`)
  }
  if (!canReadAll) {
    clauses.push(`appProperties has { key='uploadedBy' and value='${user.id}' }`)
  }

  const listed = await driveClient.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: clauses.join(' and '),
    pageSize: 50,
    fields:
      'files(id,name,mimeType,size,createdTime,webViewLink,webContentLink,parents,appProperties)',
    orderBy: 'createdTime desc',
  })

  return res.json({
    files: (listed.data.files ?? []).map(mapDriveFile),
  })
})

app.get('/api/faculty/dashboard', requireAuth, requireRoles('faculty', 'admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const requestedFacultyId = normalizeString(req.query?.facultyId)
  const facultyId = req.auth.role === 'admin' && requestedFacultyId ? requestedFacultyId : req.auth.user.id

  if (req.auth.role === 'faculty' && facultyId === req.auth.user.id) {
    await syncFacultyProfileFromUser(req.auth.user)
  }

  const { data: facultyProfile, error: facultyError } = await adminSupabase
    .from('faculty')
    .select('id,name,department,designation,status')
    .eq('id', facultyId)
    .maybeSingle()
  if (facultyError) throw facultyError

  const { data: facultySubjectRows, error: fsError } = await adminSupabase
    .from('faculty_subjects')
    .select('subject_id')
    .eq('faculty_id', facultyId)
  if (fsError) throw fsError

  const subjectIds = (facultySubjectRows ?? []).map((row) => row.subject_id).filter(Boolean)
  let subjects = []
  if (subjectIds.length > 0) {
    const { data: subjectRows, error: subjectsError } = await adminSupabase
      .from('subjects')
      .select('id,code,name,programme,semester')
      .in('id', subjectIds)
      .order('semester', { ascending: true })
      .order('name', { ascending: true })
    if (subjectsError) throw subjectsError
    subjects = subjectRows ?? []
  }

  let enrolledBySubjectId = {}
  if (subjectIds.length > 0) {
    const { data: enrollmentRows, error: enrollmentError } = await adminSupabase
      .from('student_subjects')
      .select('subject_id')
      .in('subject_id', subjectIds)
      .eq('status', 'active')
    if (enrollmentError) throw enrollmentError

    enrolledBySubjectId = (enrollmentRows ?? []).reduce((acc, row) => {
      const key = row.subject_id
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
  }

  let verificationQuery = adminSupabase
    .from('notes')
    .select('id,title,chapter,uploaded_at,uploaded_by,status,subject_id')
    .eq('note_type', 'unofficial')
    .order('uploaded_at', { ascending: false })
    .limit(50)
  if (subjectIds.length > 0) {
    verificationQuery = verificationQuery.in('subject_id', subjectIds)
  }
  const { data: verificationNotesRows, error: pendingNotesError } = await verificationQuery
  if (pendingNotesError) throw pendingNotesError

  const pendingUploaderIds = [...new Set((verificationNotesRows ?? []).map((row) => row.uploaded_by).filter(Boolean))]
  let pendingUploaders = {}
  if (pendingUploaderIds.length > 0) {
    const { data: pendingStudents, error: pendingStudentsError } = await adminSupabase
      .from('students')
      .select('id,full_name,usn')
      .in('id', pendingUploaderIds)
    if (pendingStudentsError) throw pendingStudentsError
    pendingUploaders = Object.fromEntries((pendingStudents ?? []).map((student) => [student.id, student]))
  }

  const { data: recentAssignmentsRows, error: assignmentsError } = await adminSupabase
    .from('assignments')
    .select('id,title,due_date,allow_late_submission,subject_id,subjects(code)')
    .eq('faculty_id', facultyId)
    .order('created_at', { ascending: false })
    .limit(8)
  if (assignmentsError) throw assignmentsError

  const assignmentIds = (recentAssignmentsRows ?? []).map((row) => row.id).filter(Boolean)
  let submissionCountByAssignmentId = {}
  if (assignmentIds.length > 0) {
    const { data: submissionRows, error: submissionsError } = await adminSupabase
      .from('submissions')
      .select('assignment_id')
      .in('assignment_id', assignmentIds)
    if (submissionsError) throw submissionsError
    submissionCountByAssignmentId = (submissionRows ?? []).reduce((acc, row) => {
      const key = row.assignment_id
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
  }

  const { data: officialNotesRows, error: officialNotesError } = await adminSupabase
    .from('notes')
    .select('id,title,chapter,uploaded_at,subject_id,subjects(code)')
    .eq('uploaded_by', facultyId)
    .eq('note_type', 'official')
    .order('uploaded_at', { ascending: false })
    .limit(8)
  if (officialNotesError) throw officialNotesError

  let textbooks = []
  if (driveClient) {
    const clauses = [
      "trashed = false",
      "appProperties has { key='category' and value='textbook' }",
      `appProperties has { key='uploadedBy' and value='${escapeDriveQueryValue(facultyId)}' }`,
    ]
    const listed = await driveClient.files.list({
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      q: clauses.join(' and '),
      pageSize: 20,
      fields:
        'files(id,name,mimeType,size,createdTime,webViewLink,webContentLink,parents,appProperties)',
      orderBy: 'createdTime desc',
    })
    textbooks = (listed.data.files ?? []).map(mapDriveFile)
  }

  const verificationNotes = (verificationNotesRows ?? []).map((note) => ({
    id: note.id,
    title: note.title,
    chapter: note.chapter,
    uploadedAt: note.uploaded_at,
    status: note.status,
    student: {
      id: note.uploaded_by,
      name: pendingUploaders[note.uploaded_by]?.full_name || 'Student',
      usn: pendingUploaders[note.uploaded_by]?.usn || 'NA',
    },
  }))

  return res.json({
    faculty: {
      id: facultyId,
      name: facultyProfile?.name || req.auth.user.user_metadata?.name || req.auth.user.user_metadata?.fullName || 'Faculty',
      email: req.auth.user.email,
      department: facultyProfile?.department || req.auth.user.user_metadata?.department || 'Department',
    },
    assignedSubjects: subjects.map((subject) => ({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      programme: subject.programme,
      semester: subject.semester,
      enrolledStudents: enrolledBySubjectId[subject.id] ?? 0,
    })),
    pendingVerifications: verificationNotes.filter((note) => note.status === 'pending').length,
    pendingNotes: verificationNotes.filter((note) => note.status === 'pending'),
    verificationNotes,
    recentAssignments: (recentAssignmentsRows ?? []).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subjectCode: assignment.subjects?.code || 'SUBJECT',
      dueDate: assignment.due_date,
      submissionCount: submissionCountByAssignmentId[assignment.id] ?? 0,
      isClosed: new Date(assignment.due_date).getTime() < Date.now(),
    })),
    officialNotes: (officialNotesRows ?? []).map((note) => ({
      id: note.id,
      title: note.title,
      chapter: note.chapter,
      uploadedAt: note.uploaded_at,
      subjectCode: note.subjects?.code || 'SUBJECT',
    })),
    textbooks,
  })
})

app.get('/api/files/:fileId', requireAuth, async (req, res) => {
  if (!ensureDriveConfigured(res)) {
    return
  }

  const { fileId } = req.params
  const { user, role } = req.auth
  const canReadAll = role === 'admin' || role === 'faculty'

  const found = await driveClient.files.get({
    fileId,
    supportsAllDrives: true,
    fields:
      'id,name,mimeType,size,createdTime,webViewLink,webContentLink,parents,appProperties',
  })

  if (!canReadAll) {
    const allowed = await canStudentReadDriveFile(fileId, found.data, user.id)
    if (!allowed) {
      return res.status(403).json({ message: 'You are not allowed to access this file.' })
    }
  }

  return res.json({ file: mapDriveFile(found.data) })
})

app.get('/api/files/:fileId/content', requireAuth, async (req, res) => {
  if (!ensureDriveConfigured(res)) {
    return
  }

  const { fileId } = req.params
  const { user, role } = req.auth
  const canReadAll = role === 'admin' || role === 'faculty'

  const found = await driveClient.files.get({
    fileId,
    supportsAllDrives: true,
    fields:
      'id,name,mimeType,size,createdTime,webViewLink,webContentLink,parents,appProperties',
  })

  if (!canReadAll) {
    const allowed = await canStudentReadDriveFile(fileId, found.data, user.id)
    if (!allowed) {
      return res.status(403).json({ message: 'You are not allowed to access this file.' })
    }
  }

  const media = await driveClient.files.get(
    {
      fileId,
      supportsAllDrives: true,
      alt: 'media',
    },
    { responseType: 'stream' },
  )

  const mimeType = found.data.mimeType || 'application/octet-stream'
  const fileName = normalizeString(found.data.name) || `file-${fileId}`
  const safeFileName = fileName.replace(/[\r\n"]/g, '_')

  res.setHeader('Content-Type', mimeType)
  res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`)
  if (found.data.size) {
    res.setHeader('Content-Length', String(found.data.size))
  }

  media.data.on('error', (error) => {
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to stream file from Drive.', details: error.message })
    } else {
      res.end()
    }
  })

  media.data.pipe(res)
})

app.delete('/api/files/:fileId', requireAuth, async (req, res) => {
  if (!ensureDriveConfigured(res)) {
    return
  }

  const { fileId } = req.params
  const { user, role } = req.auth
  const canManageAll = role === 'admin' || role === 'faculty'

  const found = await driveClient.files.get({
    fileId,
    supportsAllDrives: true,
    fields: 'id,name,appProperties',
  })

  const uploadedBy = found.data.appProperties?.uploadedBy
  if (!canManageAll && uploadedBy && uploadedBy !== user.id) {
    return res.status(403).json({ message: 'You are not allowed to delete this file.' })
  }

  await driveClient.files.delete({ fileId, supportsAllDrives: true })
  return res.json({ message: 'File deleted successfully.' })
})

// ---------- Admin routes ----------
app.get('/api/admin/dashboard', requireAuth, requireRoles('admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const [{ count: totalStudents }, { count: totalFaculty }, { count: totalSubjects }, { data: pendingNotes }] =
    await Promise.all([
      adminSupabase.from('students').select('*', { count: 'exact', head: true }),
      adminSupabase.from('faculty').select('*', { count: 'exact', head: true }),
      adminSupabase.from('subjects').select('*', { count: 'exact', head: true }),
      adminSupabase
        .from('notes')
        .select('id,title,uploaded_at')
        .eq('note_type', 'unofficial')
        .eq('status', 'pending')
        .order('uploaded_at', { ascending: false })
        .limit(10),
    ])

  const pendingVerifications = pendingNotes?.length ?? 0
  const recentActivities = (pendingNotes ?? []).slice(0, 5).map((n) => ({
    id: n.id,
    type: 'pending_note',
    description: `Unofficial note pending verification: ${n.title || 'Untitled'}`,
    timestamp: n.uploaded_at,
  }))

  return res.json({
    stats: {
      totalStudents: totalStudents ?? 0,
      totalFaculty: totalFaculty ?? 0,
      totalSubjects: totalSubjects ?? 0,
      pendingVerifications,
    },
    recentActivities,
  })
})

app.get('/api/admin/students', requireAuth, requireRoles('admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const search = normalizeString(req.query?.search)
  const programme = normalizeString(req.query?.programme)
  const semester = normalizeString(req.query?.semester)
  const status = normalizeString(req.query?.status)

  let query = adminSupabase
    .from('students')
    .select('id,full_name,usn,programme,semester,email,status,registered_at')
    .order('registered_at', { ascending: false })
  if (programme) query = query.eq('programme', programme)
  if (semester) query = query.eq('semester', semester)
  if (status === 'active' || status === 'disabled') query = query.eq('status', status)
  if (search && search.length >= 2) {
    const escaped = search.replace(/'/g, "''")
    query = query.or(`full_name.ilike.%${escaped}%,usn.ilike.%${escaped}%`)
  }

  const { data: rows, error } = await query
  if (error) throw error
  const students = (rows ?? []).map((s) => ({
    id: s.id,
    fullName: s.full_name,
    usn: s.usn,
    programme: s.programme,
    semester: String(s.semester),
    email: s.email ?? null,
    status: s.status,
    registeredAt: s.registered_at,
  }))
  return res.json({ students })
})

app.post('/api/admin/students/sync-emails', requireAuth, requireRoles('admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const { data: rows, error: listError } = await adminSupabase
    .from('students')
    .select('id')
  if (listError) throw listError
  let updated = 0
  for (const row of rows ?? []) {
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.getUserById(row.id)
    if (authError || !authUser?.user?.email) continue
    const email = authUser.user.email.trim()
    if (!isValidEmail(email)) continue
    const { error: updateError } = await adminSupabase
      .from('students')
      .update({ email })
      .eq('id', row.id)
    if (!updateError) updated += 1
  }
  return res.json({ message: `Synced email from Auth for ${updated} student(s).` })
})

app.post('/api/admin/students/:studentId/send-reset-password', requireAuth, requireRoles('admin'), async (req, res) => {
  const studentId = normalizeString(req.params.studentId)
  if (!studentId) return res.status(400).json({ message: 'Student ID is required.' })

  const { data: authUser, error: authError } = await adminSupabase.auth.admin.getUserById(studentId)
  if (authError || !authUser?.user) {
    return res.status(404).json({ message: 'Student account not found.' })
  }
  const email = typeof authUser.user.email === 'string' ? authUser.user.email.trim() : null
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Student has no valid email. Cannot send reset link.' })
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${PASSWORD_RESET_REDIRECT}/reset_password`,
  })
  if (error) return res.status(400).json({ message: error.message })
  return res.json({ message: 'Password reset email sent to the student\'s email address.' })
})

app.get('/api/admin/faculty', requireAuth, requireRoles('admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const search = normalizeString(req.query?.search)
  const department = normalizeString(req.query?.department)
  const status = normalizeString(req.query?.status)

  let query = adminSupabase
    .from('faculty')
    .select('id,name,department,designation,status,join_date')
    .order('join_date', { ascending: false })
  if (department) query = query.eq('department', department)
  if (status === 'active' || status === 'disabled') query = query.eq('status', status)
  if (search && search.length >= 2) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: facultyRows, error } = await query
  if (error) throw error

  const facultyIds = (facultyRows ?? []).map((f) => f.id).filter(Boolean)
  let assignedCountByFacultyId = {}
  if (facultyIds.length > 0) {
    const { data: fsRows } = await adminSupabase
      .from('faculty_subjects')
      .select('faculty_id')
      .in('faculty_id', facultyIds)
    for (const row of fsRows ?? []) {
      assignedCountByFacultyId[row.faculty_id] = (assignedCountByFacultyId[row.faculty_id] ?? 0) + 1
    }
  }

  const faculty = (facultyRows ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    email: null,
    department: f.department,
    designation: f.designation,
    assignedSubjectsCount: assignedCountByFacultyId[f.id] ?? 0,
    status: f.status,
    joinDate: f.join_date,
  }))
  return res.json({ faculty })
})

app.get('/api/subjects', requireAuth, async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const programme = normalizeString(req.query?.programme)
  const semester = normalizeString(req.query?.semester)

  let query = adminSupabase.from('subjects').select('*').order('name', { ascending: true })
  if (programme) query = query.eq('programme', programme)
  if (semester) query = query.eq('semester', semester)

  const { data, error } = await query
  if (error) throw error
  return res.json({ subjects: data ?? [] })
})

app.post('/api/faculty/:facultyId/subjects', requireAuth, requireRoles('admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const facultyId = normalizeString(req.params.facultyId)
  const subjectIds = Array.isArray(req.body?.subjectIds) ? req.body.subjectIds : []
  if (!facultyId || subjectIds.length === 0) {
    return res.status(400).json({ message: 'facultyId and subjectIds are required.' })
  }

  const rows = subjectIds.map((subjectId) => ({ faculty_id: facultyId, subject_id: subjectId }))
  const { error } = await adminSupabase.from('faculty_subjects').upsert(rows, { onConflict: 'faculty_id,subject_id' })
  if (error) throw error
  return res.json({ message: 'Subjects assigned successfully.', assignedCount: rows.length })
})

app.post('/api/subjects/:subjectId/enroll', requireAuth, requireRoles('admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const subjectId = normalizeString(req.params.subjectId)
  const studentIds = Array.isArray(req.body?.studentIds) ? req.body.studentIds : []
  if (!subjectId || studentIds.length === 0) {
    return res.status(400).json({ message: 'subjectId and studentIds are required.' })
  }

  const rows = studentIds.map((studentId) => ({ student_id: studentId, subject_id: subjectId, status: 'active' }))
  const { error } = await adminSupabase.from('student_subjects').upsert(rows, { onConflict: 'student_id,subject_id' })
  if (error) throw error
  return res.json({ message: 'Students enrolled successfully.', enrolledCount: rows.length })
})

app.get('/api/notices', requireAuth, async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const createdByRole = normalizeString(req.query?.createdByRole)?.toLowerCase()
  let query = adminSupabase
    .from('department_notices')
    .select('*')
    .order('created_at', { ascending: false })

  if (createdByRole === 'admin' || createdByRole === 'faculty') {
    query = query.eq('created_by_role', createdByRole)
  }

  const { data, error } = await query
  if (error) throw error
  return res.json({ notices: data ?? [] })
})

app.post('/api/notices', requireAuth, requireRoles('admin', 'faculty'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const title = normalizeString(req.body?.title)
  const content = normalizeString(req.body?.content)
  const urgent = req.body?.urgent === true
  if (!title || !content) {
    return res.status(400).json({ message: 'title and content are required.' })
  }

  const role = req.auth.role === 'admin' ? 'admin' : 'faculty'
  const profile = await getRoleProfile(req.auth.user.id, role)
  const authorName =
    (role === 'admin' ? profile?.name : profile?.name) ||
    normalizeString(req.auth.user.user_metadata?.name || req.auth.user.user_metadata?.fullName) ||
    (role === 'admin' ? 'Admin' : 'Faculty')

  const { data, error } = await adminSupabase
    .from('department_notices')
    .insert({
      title,
      content,
      urgent,
      created_by: req.auth.user.id,
      created_by_role: role,
      author_name: authorName,
    })
    .select('*')
    .single()
  if (error) throw error
  return res.status(201).json({ message: 'Notice created.', notice: data })
})

app.delete('/api/notices/:noticeId', requireAuth, requireRoles('admin', 'faculty'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const noticeId = normalizeString(req.params.noticeId)
  const { data: notice, error: findError } = await adminSupabase
    .from('department_notices')
    .select('*')
    .eq('id', noticeId)
    .maybeSingle()
  if (findError) throw findError
  if (!notice) return res.status(404).json({ message: 'Notice not found.' })

  if (req.auth.role === 'faculty' && notice.created_by !== req.auth.user.id) {
    return res.status(403).json({ message: 'You can delete only your own notices.' })
  }

  const { error } = await adminSupabase.from('department_notices').delete().eq('id', noticeId)
  if (error) throw error
  return res.json({ message: 'Notice deleted.' })
})

app.get('/api/academic-events', requireAuth, async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const audienceFilter = normalizeAudience(req.query?.targetAudience)
  let query = adminSupabase
    .from('academic_events')
    .select('*')
    .order('event_date', { ascending: true })

  if (audienceFilter) {
    query = query.or(`target_audience.eq.${audienceFilter},target_audience.eq.both`)
  } else if (req.auth.role === 'student') {
    query = query.or('target_audience.eq.students,target_audience.eq.both')
  } else if (req.auth.role === 'faculty') {
    query = query.or('target_audience.eq.faculty,target_audience.eq.both')
  }

  const { data, error } = await query
  if (error) throw error
  return res.json({ events: data ?? [] })
})

app.post('/api/academic-events', requireAuth, requireRoles('admin', 'faculty'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const title = normalizeString(req.body?.title)
  const eventDate = normalizeString(req.body?.date)
  const eventType = normalizeEventType(req.body?.type)
  const details = normalizeString(req.body?.details) || ''
  const targetAudience = normalizeAudience(req.body?.targetAudience) || (req.auth.role === 'admin' ? 'students' : 'both')

  if (!title || !eventDate || !eventType) {
    return res.status(400).json({ message: 'title, date and valid type are required.' })
  }

  const role = req.auth.role === 'admin' ? 'admin' : 'faculty'
  const profile = await getRoleProfile(req.auth.user.id, role)
  const createdBy =
    (role === 'admin' ? profile?.name : profile?.name) ||
    normalizeString(req.auth.user.user_metadata?.name || req.auth.user.user_metadata?.fullName) ||
    (role === 'admin' ? 'Admin' : 'Faculty')

  const { data, error } = await adminSupabase
    .from('academic_events')
    .insert({
      title,
      event_date: eventDate,
      event_type: eventType,
      details: details || 'Academic event scheduled.',
      created_by: req.auth.user.id,
      created_by_role: role,
      target_audience: targetAudience,
    })
    .select('*')
    .single()
  if (error) throw error

  return res.status(201).json({
    message: 'Academic event created.',
    event: {
      ...data,
      created_by_name: createdBy,
    },
  })
})

app.delete('/api/academic-events/:eventId', requireAuth, requireRoles('admin', 'faculty'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const eventId = normalizeString(req.params.eventId)
  const { data: event, error: findError } = await adminSupabase
    .from('academic_events')
    .select('id,created_by')
    .eq('id', eventId)
    .maybeSingle()
  if (findError) throw findError
  if (!event) return res.status(404).json({ message: 'Event not found.' })
  if (req.auth.role === 'faculty' && event.created_by !== req.auth.user.id) {
    return res.status(403).json({ message: 'You can delete only your own events.' })
  }
  const { error } = await adminSupabase.from('academic_events').delete().eq('id', eventId)
  if (error) throw error
  return res.json({ message: 'Event deleted.' })
})

app.get('/api/admin/pending-notes', requireAuth, requireRoles('admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const { data: notes, error } = await adminSupabase
    .from('notes')
    .select('id,title,uploaded_at,uploaded_by,status,note_files(id,file_name,file_type)')
    .eq('note_type', 'unofficial')
    .eq('status', 'pending')
    .order('uploaded_at', { ascending: false })
  if (error) throw error

  const uploaderIds = [...new Set((notes ?? []).map((n) => n.uploaded_by).filter(Boolean))]
  let uploaderById = {}
  if (uploaderIds.length > 0) {
    const { data: students, error: studentsErr } = await adminSupabase
      .from('students')
      .select('id,full_name,usn')
      .in('id', uploaderIds)
    if (studentsErr) throw studentsErr
    uploaderById = Object.fromEntries((students ?? []).map((s) => [s.id, s]))
  }

  function formatFromMime(mime) {
    if (!mime) return 'PDF'
    const ext = mime.split('/').pop()?.toUpperCase() ?? 'PDF'
    if (ext.includes('OPENXMLFORMATS') || ext === 'DOCX') return 'DOCX'
    if (ext === 'PNG' || ext === 'JPEG' || ext === 'JPG') return ext
    return ext === 'PDF' ? 'PDF' : ext
  }

  const pending = (notes ?? []).map((n) => {
    const student = uploaderById[n.uploaded_by] ?? {}
    const mime = n.note_files?.[0]?.file_type
    return {
      id: n.id,
      student: student.full_name ?? 'Student',
      usn: student.usn ?? '',
      title: n.title,
      format: formatFromMime(mime),
      date: n.uploaded_at,
      status: 'pending',
    }
  })

  return res.json({ pending })
})

app.get('/api/subjects/:subjectId/students', requireAuth, requireRoles('faculty', 'admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const subjectId = normalizeString(req.params.subjectId)
  const { data, error } = await adminSupabase
    .from('student_subjects')
    .select('student_id,status,enrolled_at,students(id,full_name,usn,programme,semester)')
    .eq('subject_id', subjectId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false })

  if (error) throw error
  return res.json({ students: data ?? [] })
})

app.post('/api/notes/unofficial', requireAuth, requireRoles('student'), upload.single('file'), async (req, res) => {
  if (!ensureDatabaseConfigured(res) || !ensureDriveConfigured(res)) return
  if (!req.file) return res.status(400).json({ message: 'File is required.' })

  const title = normalizeString(req.body?.title) || req.file.originalname
  const resolvedSubject = await resolveSubjectName({
    subjectId: req.body?.subjectId,
    subjectName: req.body?.subjectName,
  })
  if (!resolvedSubject.subjectName) return res.status(400).json({ message: 'subjectId or subjectName is required.' })

  const { user, role } = req.auth
  const subject = await getSubjectById(resolvedSubject.subjectId)
  await syncStudentProfileFromUser(user)

  const uploaded = await uploadToDrive({
    file: req.file,
    userId: user.id,
    role,
    subjectName: resolvedSubject.subjectName,
    folderId: req.body?.folderId,
    fileName: req.body?.fileName,
    category: 'unofficial-note',
    metadata: { contentType: 'note', noteType: 'unofficial' },
  })

  const { data: note, error: noteErr } = await adminSupabase
    .from('notes')
    .insert({
      title,
      chapter: normalizeString(req.body?.chapter) || null,
      subject_id: subject.id,
      uploaded_by: user.id,
      uploader_role: 'student',
      note_type: 'unofficial',
      status: 'pending',
    })
    .select('*')
    .single()
  if (noteErr) throw noteErr

  const { error: noteFileErr } = await adminSupabase.from('note_files').insert({
    note_id: note.id,
    file_name: uploaded.file.name,
    file_url: uploaded.file.webContentLink || uploaded.file.webViewLink || '',
    file_size: Number(uploaded.file.size || 0),
    file_type: uploaded.file.mimeType || null,
  })
  if (noteFileErr) throw noteFileErr

  return res.status(201).json({ message: 'Unofficial note uploaded and sent for verification.', note, folder: uploaded.folder })
})

app.post('/api/notes/official', requireAuth, requireRoles('faculty', 'admin'), upload.single('file'), async (req, res) => {
  if (!ensureDatabaseConfigured(res) || !ensureDriveConfigured(res)) return
  if (!req.file) return res.status(400).json({ message: 'File is required.' })

  const title = normalizeString(req.body?.title) || req.file.originalname
  const resolvedSubject = await resolveSubjectName({
    subjectId: req.body?.subjectId,
    subjectName: req.body?.subjectName,
  })
  if (!resolvedSubject.subjectName) return res.status(400).json({ message: 'subjectId or subjectName is required.' })

  const { user, role } = req.auth
  const subject = await getSubjectById(resolvedSubject.subjectId)
  if (role === 'faculty') await syncFacultyProfileFromUser(user)
  if (role === 'admin') await syncAdminProfileFromUser(user)

  const uploaded = await uploadToDrive({
    file: req.file,
    userId: user.id,
    role,
    subjectName: resolvedSubject.subjectName,
    folderId: req.body?.folderId,
    fileName: req.body?.fileName,
    category: 'official-note',
    metadata: { contentType: 'note', noteType: 'official' },
  })

  const { data: note, error: noteErr } = await adminSupabase
    .from('notes')
    .insert({
      title,
      chapter: normalizeString(req.body?.chapter) || null,
      subject_id: subject.id,
      uploaded_by: user.id,
      uploader_role: 'faculty',
      note_type: 'official',
      status: 'verified',
      verified_by: role === 'faculty' ? user.id : null,
      verified_at: role === 'faculty' ? new Date().toISOString() : null,
    })
    .select('*')
    .single()
  if (noteErr) throw noteErr

  const { error: noteFileErr } = await adminSupabase.from('note_files').insert({
    note_id: note.id,
    file_name: uploaded.file.name,
    file_url: uploaded.file.webContentLink || uploaded.file.webViewLink || '',
    file_size: Number(uploaded.file.size || 0),
    file_type: uploaded.file.mimeType || null,
  })
  if (noteFileErr) throw noteFileErr

  return res.status(201).json({ message: 'Official note uploaded successfully.', note, folder: uploaded.folder })
})

app.get('/api/notes', requireAuth, async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const { user, role } = req.auth
  const type = normalizeString(req.query?.type)
  const status = normalizeString(req.query?.status)
  const subjectName = normalizeString(req.query?.subjectName)

  let query = adminSupabase
    .from('notes')
    .select('*, subjects(id,name,code), note_files(id,file_name,file_url,file_size,file_type,uploaded_at)')
    .order('uploaded_at', { ascending: false })
  if (type) query = query.eq('note_type', type)
  if (status) query = query.eq('status', status)
  if (subjectName) query = query.eq('subjects.name', subjectName)
  if (role === 'student') query = query.or(`note_type.eq.official,uploaded_by.eq.${user.id}`)

  const { data, error } = await query
  if (error) throw error
  return res.json({ notes: data ?? [] })
})

app.get('/api/notes/unofficial/discover', requireAuth, async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const search = normalizeString(req.query?.search)?.toLowerCase() || ''
  const chapter = normalizeString(req.query?.chapter)

  let query = adminSupabase
    .from('notes')
    .select('id,title,chapter,uploaded_at,uploaded_by,status,note_files(id,file_name,file_url,file_size,file_type,uploaded_at)')
    .eq('note_type', 'unofficial')
    .eq('status', 'verified')
    .order('uploaded_at', { ascending: false })

  if (chapter && chapter !== 'All Units') {
    query = query.eq('chapter', chapter)
  }

  const { data: notes, error } = await query
  if (error) throw error

  const uploaderIds = [...new Set((notes ?? []).map((note) => note.uploaded_by).filter(Boolean))]
  let uploaderById = {}
  if (uploaderIds.length > 0) {
    const { data: students, error: studentsError } = await adminSupabase
      .from('students')
      .select('id,full_name,usn')
      .in('id', uploaderIds)
    if (studentsError) throw studentsError
    uploaderById = Object.fromEntries((students ?? []).map((student) => [student.id, student]))
  }

  const mapped = (notes ?? [])
    .map((note) => {
      const uploader = uploaderById[note.uploaded_by] ?? null
      return {
        id: note.id,
        title: note.title,
        chapter: note.chapter,
        uploadedAt: note.uploaded_at,
        uploader: {
          id: note.uploaded_by,
          name: uploader?.full_name || 'Student',
          usn: uploader?.usn || 'NA',
        },
        file: note.note_files?.[0] ?? null,
        status: note.status,
      }
    })
    .filter((note) => {
      if (!search) return true
      return (
        note.title.toLowerCase().includes(search) ||
        note.uploader.name.toLowerCase().includes(search) ||
        note.uploader.usn.toLowerCase().includes(search)
      )
    })

  return res.json({ notes: mapped })
})

app.patch('/api/notes/:noteId/verify', requireAuth, requireRoles('faculty', 'admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const status = normalizeString(req.body?.status)?.toLowerCase()
  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ message: 'status must be either approved or rejected.' })
  }

  const noteId = normalizeString(req.params.noteId)
  const { data: note, error: findErr } = await adminSupabase.from('notes').select('*').eq('id', noteId).single()
  if (findErr) throw findErr
  if (!note) return res.status(404).json({ message: 'Note not found.' })
  if (note.note_type !== 'unofficial') {
    return res.status(400).json({ message: 'Only unofficial notes require verification.' })
  }

  const nextStatus = status === 'approved' ? 'verified' : 'rejected'
  const { data: updated, error } = await adminSupabase
    .from('notes')
    .update({
      status: nextStatus,
      verified_by: req.auth.role === 'faculty' ? req.auth.user.id : null,
      verified_at: new Date().toISOString(),
      rejection_reason: status === 'rejected' ? normalizeString(req.body?.reviewerComment) || null : null,
    })
    .eq('id', noteId)
    .select('*')
    .single()
  if (error) throw error
  return res.json({ message: 'Note verification updated.', note: updated })
})

app.post('/api/assignments', requireAuth, requireRoles('faculty', 'admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const title = normalizeString(req.body?.title)
  const subjectNameInput = normalizeString(req.body?.subjectName)
  const subjectIdInput = normalizeString(req.body?.subjectId)
  const instructions = normalizeString(req.body?.description || req.body?.instructions) || ''
  const dueAt = normalizeString(req.body?.dueAt || req.body?.dueDate)
  const maxMarks = Number(req.body?.maxMarks || req.body?.totalMarks)

  if (!title || (!subjectNameInput && !subjectIdInput) || !dueAt || Number.isNaN(maxMarks)) {
    return res.status(400).json({ message: 'title, subjectId/subjectName, dueAt and numeric maxMarks are required.' })
  }

  const subject = subjectIdInput
    ? await getSubjectById(subjectIdInput)
    : await getOrCreateSubjectByName(subjectNameInput)
  if (!subject) return res.status(400).json({ message: 'Invalid subjectId.' })
  const facultyId = req.auth.user.id
  if (req.auth.role === 'faculty') await syncFacultyProfileFromUser(req.auth.user)

  const { data: assignment, error } = await adminSupabase
    .from('assignments')
    .insert({
      title,
      subject_id: subject.id,
      faculty_id: facultyId,
      instructions,
      total_marks: maxMarks,
      due_date: dueAt,
      allow_late_submission: Boolean(req.body?.allowLateSubmission),
    })
    .select('*, subjects(id,name,code)')
    .single()
  if (error) throw error

  return res.status(201).json({ message: 'Assignment created.', assignment })
})

app.get('/api/assignments/:assignmentId', requireAuth, async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const assignmentId = normalizeString(req.params.assignmentId)
  const { data: assignment, error } = await adminSupabase
    .from('assignments')
    .select('*, subjects(id,name,code,programme,semester)')
    .eq('id', assignmentId)
    .single()
  if (error) throw error
  if (!assignment) return res.status(404).json({ message: 'Assignment not found.' })
  return res.json({ assignment })
})

app.get('/api/assignments/:assignmentId/submission', requireAuth, requireRoles('student'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const assignmentId = normalizeString(req.params.assignmentId)
  const studentId = req.auth.user.id
  const { data: submission, error } = await adminSupabase
    .from('submissions')
    .select('*, submission_files(id,file_name,file_url,file_size,file_type,uploaded_at), grades(id,marks,grade,feedback,graded_at,is_released)')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .maybeSingle()
  if (error) throw error
  return res.json({ submission: submission ?? null })
})

app.get('/api/assignments', requireAuth, async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const subjectName = normalizeString(req.query?.subjectName)
  let query = adminSupabase
    .from('assignments')
    .select('*, subjects(id,name,code)')
    .order('created_at', { ascending: false })
  if (subjectName) query = query.eq('subjects.name', subjectName)

  const { data, error } = await query
  if (error) throw error
  return res.json({ assignments: data ?? [] })
})

app.post('/api/assignments/:assignmentId/submit', requireAuth, requireRoles('student'), upload.single('file'), async (req, res) => {
  if (!ensureDatabaseConfigured(res) || !ensureDriveConfigured(res)) return
  if (!req.file) return res.status(400).json({ message: 'File is required.' })

  const assignmentId = normalizeString(req.params.assignmentId)
  const { data: assignment, error: assignmentErr } = await adminSupabase
    .from('assignments')
    .select('*, subjects(id,name,code)')
    .eq('id', assignmentId)
    .single()
  if (assignmentErr) throw assignmentErr
  if (!assignment) return res.status(404).json({ message: 'Assignment not found.' })

  const studentId = req.auth.user.id
  await syncStudentProfileFromUser(req.auth.user)

  const uploaded = await uploadToDrive({
    file: req.file,
    userId: studentId,
    role: req.auth.role,
    subjectName: assignment.subjects?.name || null,
    folderId: req.body?.folderId,
    fileName: req.body?.fileName,
    category: 'assignment-submission',
    metadata: { contentType: 'submission', assignmentId, studentId },
  })

  const dueDate = new Date(assignment.due_date)
  const now = new Date()
  const isLate = now > dueDate
  if (isLate && !assignment.allow_late_submission) {
    return res.status(400).json({ message: 'Deadline passed and late submission is not allowed.' })
  }

  const { data: submission, error: submissionErr } = await adminSupabase
    .from('submissions')
    .upsert(
      {
        assignment_id: assignmentId,
        student_id: studentId,
        status: isLate ? 'late' : 'submitted',
        submitted_at: now.toISOString(),
        is_late: isLate,
        comment: normalizeString(req.body?.comment) || null,
      },
      { onConflict: 'assignment_id,student_id' },
    )
    .select('*')
    .single()
  if (submissionErr) throw submissionErr

  const { error: fileErr } = await adminSupabase.from('submission_files').insert({
    submission_id: submission.id,
    file_name: uploaded.file.name,
    file_url: uploaded.file.webContentLink || uploaded.file.webViewLink || '',
    file_size: Number(uploaded.file.size || 0),
    file_type: uploaded.file.mimeType || null,
  })
  if (fileErr) throw fileErr

  return res.status(201).json({ message: 'Assignment submitted.', submission, folder: uploaded.folder })
})

app.get('/api/assignments/:assignmentId/submissions', requireAuth, requireRoles('faculty', 'admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const assignmentId = normalizeString(req.params.assignmentId)
  const { data: assignment, error: assignmentErr } = await adminSupabase
    .from('assignments')
    .select('*, subjects(id,name,code)')
    .eq('id', assignmentId)
    .single()
  if (assignmentErr) throw assignmentErr
  if (!assignment) return res.status(404).json({ message: 'Assignment not found.' })

  const { data: submissions, error } = await adminSupabase
    .from('submissions')
    .select(
      '*, students(id,full_name,usn,programme,semester), submission_files(id,file_name,file_url,file_size,file_type,uploaded_at), grades(id,marks,grade,feedback,graded_by,graded_at,is_released)',
    )
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })
  if (error) throw error

  return res.json({ assignment, submissions: submissions ?? [] })
})

app.patch('/api/submissions/:submissionId/grade', requireAuth, requireRoles('faculty', 'admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const submissionId = normalizeString(req.params.submissionId)
  const { data: submission, error: submissionErr } = await adminSupabase
    .from('submissions')
    .select('*, assignments(id,total_marks)')
    .eq('id', submissionId)
    .single()
  if (submissionErr) throw submissionErr
  if (!submission) return res.status(404).json({ message: 'Submission not found.' })

  const maxMarks = Number(submission.assignments?.total_marks || 0)
  const marks = Number(req.body?.marks)
  if (Number.isNaN(marks)) return res.status(400).json({ message: 'marks must be numeric.' })
  if (marks < 0 || marks > maxMarks) {
    return res.status(400).json({ message: `marks must be between 0 and ${maxMarks}.` })
  }

  if (req.auth.role === 'faculty') await syncFacultyProfileFromUser(req.auth.user)

  const { data: grade, error } = await adminSupabase
    .from('grades')
    .upsert(
      {
        submission_id: submissionId,
        marks,
        grade: normalizeString(req.body?.grade) || String(marks),
        feedback: normalizeString(req.body?.feedback) || null,
        graded_by: req.auth.user.id,
        graded_at: new Date().toISOString(),
        is_released: req.body?.isReleased === true,
        released_at: req.body?.isReleased === true ? new Date().toISOString() : null,
      },
      { onConflict: 'submission_id' },
    )
    .select('*')
    .single()
  if (error) throw error

  return res.json({ message: 'Submission graded.', grade })
})

app.post('/api/auth/logout', requireAuth, (_req, res) => {
  res.json({ message: 'Logged out successfully.' })
})

const PASSWORD_RESET_REDIRECT = process.env.PASSWORD_RESET_REDIRECT_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173'

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = normalizeString(req.body?.email)
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'A valid email is required.' })
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${PASSWORD_RESET_REDIRECT}/reset_password`,
  })
  if (error) {
    return res.status(400).json({ message: error.message })
  }
  return res.json({ message: 'If an account exists for this email, you will receive a password reset link.' })
})

app.post('/api/auth/reset-password', async (req, res) => {
  const accessToken = normalizeString(req.body?.accessToken ?? req.body?.token)
  const newPassword = normalizeString(req.body?.newPassword ?? req.body?.password)
  if (!accessToken || !newPassword) {
    return res.status(400).json({ message: 'accessToken and newPassword are required.' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' })
  }
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !userData?.user) {
    return res.status(400).json({ message: 'Invalid or expired reset token. Request a new link.' })
  }
  const { error } = await adminSupabase.auth.admin.updateUserById(userData.user.id, {
    password: newPassword,
  })
  if (error) {
    return res.status(400).json({ message: error.message })
  }
  return res.json({ message: 'Password has been reset. You can now sign in.' })
})

app.post('/api/auth/faculty/register', requireAuth, requireRoles('admin'), async (req, res) => {
  if (!ensureDatabaseConfigured(res)) return

  const name = normalizeString(req.body?.name)
  const email = normalizeString(req.body?.email)
  const department = normalizeString(req.body?.department)
  const designation = normalizeString(req.body?.designation)
  const password = normalizeString(req.body?.temporaryPassword ?? req.body?.password)

  if (!name || !email) {
    return res.status(400).json({ message: 'name and email are required.' })
  }
  const validationError = validateCredentials(email, password)
  if (validationError) return res.status(400).json({ message: validationError })

  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'faculty' },
    user_metadata: {
      role: 'faculty',
      name: name || email,
      department: department || 'General',
      designation: designation || null,
    },
  })

  if (error) return res.status(400).json({ message: error.message })
  if (!data.user) return res.status(500).json({ message: 'Unable to create faculty account.' })

  await syncFacultyProfileFromUser(data.user)
  return res.status(201).json({
    message: 'Faculty account created successfully.',
    user: { id: data.user.id, email: data.user.email, role: 'faculty' },
  })
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

  await syncStudentProfileFromUser(data.user)

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
  if (error instanceof SyntaxError && error?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON payload.' })
  }

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: `File too large. Maximum size is ${MAX_UPLOAD_SIZE_MB} MB.`,
    })
  }

  if (error?.code === 404 || error?.response?.status === 404) {
    return res.status(404).json({ message: 'Resource not found in Google Drive.' })
  }

  const upstreamStatus =
    typeof error?.response?.status === 'number'
      ? error.response.status
      : typeof error?.code === 'number'
        ? error.code
        : null
  const upstreamMessage =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    'Internal server error.'

  if (upstreamStatus && upstreamStatus >= 400 && upstreamStatus < 600) {
    return res.status(upstreamStatus).json({ message: upstreamMessage })
  }

  console.error(error)
  res.status(500).json({ message: upstreamMessage })
})

app.listen(Number(PORT), () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})

