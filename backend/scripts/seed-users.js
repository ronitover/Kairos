import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function normalizeRole(role) {
  const value = String(role || '').toLowerCase().trim()
  if (value !== 'faculty' && value !== 'admin') {
    throw new Error(`Unsupported role: ${role}`)
  }
  return value
}

async function findUserByEmail(email) {
  const perPage = 200
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data?.users ?? []

    const found = users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (users.length < perPage) return null

    page += 1
  }
}

async function createOrGetAuthUser(userInput) {
  const existing = await findUserByEmail(userInput.email)
  if (existing) return existing

  const { data, error } = await supabase.auth.admin.createUser({
    email: userInput.email,
    password: userInput.password,
    email_confirm: true,
    app_metadata: { role: userInput.role },
    user_metadata: {
      name: userInput.name,
      department: userInput.department,
      designation: userInput.designation,
      adminRole: userInput.adminRole,
      role: userInput.role,
    },
  })

  if (error || !data.user) {
    throw error ?? new Error(`Failed to create auth user for ${userInput.email}`)
  }

  return data.user
}

async function upsertRoleProfile(userInput, userId) {
  if (userInput.role === 'faculty') {
    const { error } = await supabase.from('faculty').upsert(
      {
        id: userId,
        name: userInput.name,
        department: userInput.department || 'Computer Applications',
        designation: userInput.designation || null,
        status: 'active',
      },
      { onConflict: 'id' },
    )

    if (error) throw error
    return
  }

  const { error } = await supabase.from('admins').upsert(
    {
      id: userId,
      name: userInput.name,
      role: userInput.adminRole === 'super_admin' ? 'super_admin' : 'admin',
    },
    { onConflict: 'id' },
  )

  if (error) throw error
}

async function run() {
  const inputArg = process.argv[2]
  const inputPath = path.resolve(process.cwd(), inputArg || 'scripts/seed-users.json')

  const raw = await fs.readFile(inputPath, 'utf8')
  const payload = JSON.parse(raw)
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Input must be a non-empty JSON array.')
  }

  const summary = []

  for (const item of payload) {
    const role = normalizeRole(item.role)
    const email = String(item.email || '').trim()
    const password = String(item.password || '').trim()
    const name = String(item.name || '').trim()

    if (!email || !password || !name) {
      throw new Error('Each record needs role, email, password, and name.')
    }

    const userInput = {
      role,
      email,
      password,
      name,
      department: item.department ? String(item.department).trim() : undefined,
      designation: item.designation ? String(item.designation).trim() : undefined,
      adminRole: item.adminRole ? String(item.adminRole).trim() : undefined,
    }

    const authUser = await createOrGetAuthUser(userInput)
    await upsertRoleProfile(userInput, authUser.id)

    summary.push({ role: userInput.role, email: userInput.email, userId: authUser.id })
  }

  console.log('Seed completed:')
  for (const row of summary) {
    console.log(`- ${row.role.toUpperCase()} | ${row.email} | ${row.userId}`)
  }
}

run().catch((error) => {
  console.error('Seed failed:', error.message || error)
  process.exit(1)
})
