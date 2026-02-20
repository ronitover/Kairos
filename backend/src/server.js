import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import { PassThrough } from 'node:stream'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

dotenv.config()

const {
  PORT = 4000,
  CORS_ORIGIN = 'http://localhost:5173',
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
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

const notesStore = new Map()
const assignmentsStore = new Map()
const submissionsStore = new Map()

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

app.get('/api/me', requireAuth, (req, res) => {
  const { user, role } = req.auth

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
  if (!ensureDriveConfigured(res)) {
    return
  }

  if (!req.file) {
    return res.status(400).json({ message: 'File is required. Use multipart/form-data with key "file".' })
  }

  const { user, role } = req.auth
  const uploaded = await uploadToDrive({
    file: req.file,
    userId: user.id,
    role,
    subjectName: req.body?.subjectName,
    folderId: req.body?.folderId,
    fileName: req.body?.fileName,
    category: req.body?.category,
  })

  return res.status(201).json({
    message: 'File uploaded to Google Drive successfully.',
    file: uploaded.file,
    folder: uploaded.folder,
  })
})

app.get('/api/files', requireAuth, async (req, res) => {
  if (!ensureDriveConfigured(res)) {
    return
  }

  const { user, role } = req.auth
  const canReadAll = role === 'admin' || role === 'faculty'
  const subjectName = normalizeString(req.query?.subjectName)

  const clauses = ["trashed = false"]
  clauses.push("appProperties has { key='uploadedBy' }")
  if (subjectName) {
    clauses.push(`appProperties has { key='subjectName' and value='${escapeDriveQueryValue(subjectName)}' }`)
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

  const uploadedBy = found.data.appProperties?.uploadedBy
  if (!canReadAll && uploadedBy && uploadedBy !== user.id) {
    return res.status(403).json({ message: 'You are not allowed to access this file.' })
  }

  return res.json({ file: mapDriveFile(found.data) })
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

app.post('/api/notes/unofficial', requireAuth, requireRoles('student'), upload.single('file'), async (req, res) => {
  if (!ensureDriveConfigured(res)) {
    return
  }
  if (!req.file) {
    return res.status(400).json({ message: 'File is required.' })
  }

  const title = normalizeString(req.body?.title) || req.file.originalname
  const subjectName = normalizeString(req.body?.subjectName)
  if (!subjectName) {
    return res.status(400).json({ message: 'subjectName is required.' })
  }

  const { user, role } = req.auth
  const uploaded = await uploadToDrive({
    file: req.file,
    userId: user.id,
    role,
    subjectName,
    folderId: req.body?.folderId,
    fileName: req.body?.fileName,
    category: 'unofficial-note',
    metadata: { contentType: 'note', noteType: 'unofficial' },
  })

  const note = {
    id: randomUUID(),
    title,
    subjectName,
    type: 'unofficial',
    status: 'pending',
    uploadedBy: user.id,
    uploadedByEmail: user.email,
    createdAt: new Date().toISOString(),
    file: uploaded.file,
    reviewerId: null,
    reviewerComment: null,
  }
  notesStore.set(note.id, note)

  return res.status(201).json({
    message: 'Unofficial note uploaded and sent for verification.',
    note,
    folder: uploaded.folder,
  })
})

app.post('/api/notes/official', requireAuth, requireRoles('faculty', 'admin'), upload.single('file'), async (req, res) => {
  if (!ensureDriveConfigured(res)) {
    return
  }
  if (!req.file) {
    return res.status(400).json({ message: 'File is required.' })
  }

  const title = normalizeString(req.body?.title) || req.file.originalname
  const subjectName = normalizeString(req.body?.subjectName)
  if (!subjectName) {
    return res.status(400).json({ message: 'subjectName is required.' })
  }

  const { user, role } = req.auth
  const uploaded = await uploadToDrive({
    file: req.file,
    userId: user.id,
    role,
    subjectName,
    folderId: req.body?.folderId,
    fileName: req.body?.fileName,
    category: 'official-note',
    metadata: { contentType: 'note', noteType: 'official' },
  })

  const note = {
    id: randomUUID(),
    title,
    subjectName,
    type: 'official',
    status: 'approved',
    uploadedBy: user.id,
    uploadedByEmail: user.email,
    createdAt: new Date().toISOString(),
    file: uploaded.file,
    reviewerId: user.id,
    reviewerComment: 'Auto-approved official upload',
  }
  notesStore.set(note.id, note)

  return res.status(201).json({
    message: 'Official note uploaded successfully.',
    note,
    folder: uploaded.folder,
  })
})

app.get('/api/notes', requireAuth, async (req, res) => {
  const { user, role } = req.auth
  const type = normalizeString(req.query?.type)
  const status = normalizeString(req.query?.status)
  const subjectName = normalizeString(req.query?.subjectName)

  let notes = Array.from(notesStore.values())
  if (type) notes = notes.filter((note) => note.type === type)
  if (status) notes = notes.filter((note) => note.status === status)
  if (subjectName) notes = notes.filter((note) => note.subjectName === subjectName)

  if (role === 'student') {
    notes = notes.filter((note) => note.type === 'official' || note.uploadedBy === user.id)
  }

  notes.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return res.json({ notes })
})

app.patch('/api/notes/:noteId/verify', requireAuth, requireRoles('faculty', 'admin'), (req, res) => {
  const { noteId } = req.params
  const status = normalizeString(req.body?.status)?.toLowerCase()
  const reviewerComment = normalizeString(req.body?.reviewerComment) || null
  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ message: 'status must be either approved or rejected.' })
  }

  const existing = notesStore.get(noteId)
  if (!existing) {
    return res.status(404).json({ message: 'Note not found.' })
  }
  if (existing.type !== 'unofficial') {
    return res.status(400).json({ message: 'Only unofficial notes require verification.' })
  }

  const updated = {
    ...existing,
    status,
    reviewerId: req.auth.user.id,
    reviewerComment,
    reviewedAt: new Date().toISOString(),
  }
  notesStore.set(noteId, updated)
  return res.json({ message: 'Note verification updated.', note: updated })
})

app.post('/api/assignments', requireAuth, requireRoles('faculty', 'admin'), (req, res) => {
  const title = normalizeString(req.body?.title)
  const subjectName = normalizeString(req.body?.subjectName)
  const description = normalizeString(req.body?.description) || ''
  const dueAt = normalizeString(req.body?.dueAt)
  const maxMarks = Number(req.body?.maxMarks)

  if (!title || !subjectName || !dueAt || Number.isNaN(maxMarks)) {
    return res.status(400).json({
      message: 'title, subjectName, dueAt and numeric maxMarks are required.',
    })
  }

  const assignment = {
    id: randomUUID(),
    title,
    subjectName,
    description,
    dueAt,
    maxMarks,
    createdBy: req.auth.user.id,
    createdByEmail: req.auth.user.email,
    createdAt: new Date().toISOString(),
  }
  assignmentsStore.set(assignment.id, assignment)
  return res.status(201).json({ message: 'Assignment created.', assignment })
})

app.get('/api/assignments', requireAuth, (req, res) => {
  const subjectName = normalizeString(req.query?.subjectName)
  let assignments = Array.from(assignmentsStore.values())
  if (subjectName) assignments = assignments.filter((item) => item.subjectName === subjectName)
  assignments.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return res.json({ assignments })
})

app.post('/api/assignments/:assignmentId/submit', requireAuth, requireRoles('student'), upload.single('file'), async (req, res) => {
  if (!ensureDriveConfigured(res)) {
    return
  }
  if (!req.file) {
    return res.status(400).json({ message: 'File is required.' })
  }

  const assignment = assignmentsStore.get(req.params.assignmentId)
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found.' })
  }

  const { user, role } = req.auth
  const uploaded = await uploadToDrive({
    file: req.file,
    userId: user.id,
    role,
    subjectName: assignment.subjectName,
    folderId: req.body?.folderId,
    fileName: req.body?.fileName,
    category: 'assignment-submission',
    metadata: {
      contentType: 'submission',
      assignmentId: assignment.id,
      studentId: user.id,
    },
  })

  const submission = {
    id: randomUUID(),
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    subjectName: assignment.subjectName,
    studentId: user.id,
    studentEmail: user.email,
    submittedAt: new Date().toISOString(),
    file: uploaded.file,
    grade: null,
    feedback: null,
    gradedBy: null,
    gradedAt: null,
  }
  submissionsStore.set(submission.id, submission)
  return res.status(201).json({ message: 'Assignment submitted.', submission, folder: uploaded.folder })
})

app.get('/api/assignments/:assignmentId/submissions', requireAuth, requireRoles('faculty', 'admin'), (req, res) => {
  const assignment = assignmentsStore.get(req.params.assignmentId)
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found.' })
  }

  const submissions = Array.from(submissionsStore.values())
    .filter((item) => item.assignmentId === assignment.id)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))

  return res.json({ assignment, submissions })
})

app.patch('/api/submissions/:submissionId/grade', requireAuth, requireRoles('faculty', 'admin'), (req, res) => {
  const submission = submissionsStore.get(req.params.submissionId)
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found.' })
  }

  const assignment = assignmentsStore.get(submission.assignmentId)
  if (!assignment) {
    return res.status(404).json({ message: 'Parent assignment not found.' })
  }

  const marks = Number(req.body?.marks)
  const feedback = normalizeString(req.body?.feedback) || ''
  const grade = normalizeString(req.body?.grade) || null
  if (Number.isNaN(marks)) {
    return res.status(400).json({ message: 'marks must be numeric.' })
  }
  if (marks < 0 || marks > assignment.maxMarks) {
    return res.status(400).json({ message: `marks must be between 0 and ${assignment.maxMarks}.` })
  }

  const updated = {
    ...submission,
    grade: grade ?? String(marks),
    marks,
    feedback,
    gradedBy: req.auth.user.id,
    gradedAt: new Date().toISOString(),
  }
  submissionsStore.set(updated.id, updated)
  return res.json({ message: 'Submission graded.', submission: updated })
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
