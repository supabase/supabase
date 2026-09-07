import { execSync, spawn } from 'child_process'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'

// Root of the Supabase docker directory — adjust via env if needed
const SUPABASE_ROOT = process.env.SUPABASE_ROOT ?? path.join(process.cwd(), '..', '..')
const REGISTRY_PATH =
  process.env.DATABASE_REGISTRY_PATH ??
  path.join(SUPABASE_ROOT, 'docker', 'volumes', 'registry', 'databases.json')
const SCRIPTS_DIR = path.join(SUPABASE_ROOT, 'scripts')
const DOCKER_SCRIPTS_DIR = path.join(SUPABASE_ROOT, 'docker', 'scripts')
const DOCKER_DIR = path.join(SUPABASE_ROOT, 'docker')

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function generatePassword(length = 32): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length)
}

function generateJwtSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}

function readRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8')
  return JSON.parse(raw)
}

function writeRegistry(data: object) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: false })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
  return handleCreate(req, res)
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { name, ref: customRef, password: customPassword } = req.body as {
    name?: string
    ref?: string
    password?: string
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'name is required and must be at least 2 characters' })
  }

  const cleanName = name.trim()
  const ref = customRef?.trim() ? slugify(customRef.trim()) : slugify(cleanName)

  if (!/^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(ref) && ref.length < 2) {
    return res.status(400).json({ error: 'ref must be lowercase alphanumeric with hyphens' })
  }

  // Ensure ref is unique
  const registry = readRegistry()
  const existing = registry.databases as Array<{ ref: string }>
  if (existing.some((db) => db.ref === ref)) {
    return res.status(409).json({ error: `A database with ref "${ref}" already exists` })
  }

  const password = customPassword?.trim() || generatePassword()
  const jwtSecret = generateJwtSecret()
  const now = new Date().toISOString()

  // Env var names for this database
  const refUpper = ref.toUpperCase().replace(/-/g, '_')
  const passwordEnv = `DB_${refUpper}_PASSWORD`
  const jwtSecretEnv = `DB_${refUpper}_JWT_SECRET`
  const anonKeyEnv = `DB_${refUpper}_ANON_KEY`
  const serviceKeyEnv = `DB_${refUpper}_SERVICE_KEY`

  const newEntry = {
    ref,
    name: cleanName,
    host: `db-${ref}`,
    port: 5432,
    database: 'postgres',
    password_env: passwordEnv,
    jwt_secret_env: jwtSecretEnv,
    anon_key_env: anonKeyEnv,
    service_key_env: serviceKeyEnv,
    created_at: now,
  }

  // 1. Add to registry
  registry.databases.push(newEntry)
  writeRegistry(registry)

  // 2. Regenerate compose and Envoy configs
  const generators = [
    path.join(DOCKER_DIR, 'generate-multi.py'),
    path.join(DOCKER_SCRIPTS_DIR, 'generate-compose-auth.py'),
    path.join(SCRIPTS_DIR, 'generate-compose-rest.py'),
    path.join(SCRIPTS_DIR, 'generate-compose-storage.py'),
    path.join(SCRIPTS_DIR, 'generate-envoy-config.py'),
  ]

  const errors: string[] = []
  for (const gen of generators) {
    if (!fs.existsSync(gen)) continue
    try {
      execSync(`python3 "${gen}"`, {
        cwd: SUPABASE_ROOT,
        env: { ...process.env, DATABASE_REGISTRY_PATH: REGISTRY_PATH },
        timeout: 15000,
      })
    } catch (e: any) {
      errors.push(`${path.basename(gen)}: ${e.message?.slice(0, 100)}`)
    }
  }

  // 3. Return created project info (including generated secrets the user must save)
  return res.status(201).json({
    ref,
    name: cleanName,
    host: `db-${ref}`,
    port: 5432,
    database: 'postgres',
    status: 'CREATING',
    created_at: now,
    // Secrets — shown once, must be saved by the user
    credentials: {
      password,
      jwt_secret: jwtSecret,
      password_env: passwordEnv,
      jwt_secret_env: jwtSecretEnv,
    },
    env_vars: [
      `${passwordEnv}=${password}`,
      `${jwtSecretEnv}=${jwtSecret}`,
    ],
    next_steps: [
      `Add the env_vars above to your .env file`,
      `Run: docker compose -f docker/docker-compose.yml -f docker/docker-compose.multi.yml up -d db-${ref} auth-${ref} rest-${ref} storage-${ref}`,
      `Then: bash scripts/init-database.sh --ref ${ref} --host db-${ref} --password '${password}'`,
    ],
    generator_errors: errors.length > 0 ? errors : undefined,
  })
}