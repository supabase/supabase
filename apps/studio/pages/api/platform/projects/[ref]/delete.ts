import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'

const SUPABASE_ROOT = process.env.SUPABASE_ROOT ?? path.join(process.cwd(), '..', '..')
const REGISTRY_PATH =
  process.env.DATABASE_REGISTRY_PATH ??
  path.join(SUPABASE_ROOT, 'docker', 'volumes', 'registry', 'databases.json')
const SCRIPTS_DIR = path.join(SUPABASE_ROOT, 'scripts')
const DOCKER_SCRIPTS_DIR = path.join(SUPABASE_ROOT, 'docker', 'scripts')
const DOCKER_DIR = path.join(SUPABASE_ROOT, 'docker')

function readRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
}

function writeRegistry(data: object) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: false })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
  return handleDelete(req, res)
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { ref } = req.query as { ref: string }

  if (!ref || ref === 'default') {
    return res.status(400).json({ error: 'Cannot delete the default database' })
  }

  const registry = readRegistry()
  const databases = registry.databases as Array<{ ref: string }>
  const idx = databases.findIndex((db) => db.ref === ref)

  if (idx === -1) {
    return res.status(404).json({ error: `Project "${ref}" not found in registry` })
  }

  const warnings: string[] = []

  // 1. Stop and remove containers for this project
  const services = [`db-${ref}`, `auth-${ref}`, `rest-${ref}`, `storage-${ref}`]
  for (const service of services) {
    try {
      execSync(`docker stop ${service} 2>/dev/null || true`, { timeout: 15000 })
      execSync(`docker rm ${service} 2>/dev/null || true`, { timeout: 10000 })
    } catch {
      warnings.push(`Could not stop/remove container: ${service}`)
    }
  }

  // 2. Remove from registry
  registry.databases.splice(idx, 1)
  writeRegistry(registry)

  // 3. Regenerate compose / Envoy configs without this database
  const generators = [
    path.join(DOCKER_DIR, 'generate-multi.py'),
    path.join(DOCKER_SCRIPTS_DIR, 'generate-compose-auth.py'),
    path.join(SCRIPTS_DIR, 'generate-compose-rest.py'),
    path.join(SCRIPTS_DIR, 'generate-compose-storage.py'),
    path.join(SCRIPTS_DIR, 'generate-envoy-config.py'),
  ]

  for (const gen of generators) {
    if (!fs.existsSync(gen)) continue
    try {
      execSync(`python3 "${gen}"`, {
        cwd: SUPABASE_ROOT,
        env: { ...process.env, DATABASE_REGISTRY_PATH: REGISTRY_PATH },
        timeout: 15000,
      })
    } catch {
      // Non-fatal — registry is already updated
    }
  }

  return res.status(200).json({
    ref,
    deleted: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    message: `Project "${ref}" has been removed. Remember to remove its env vars (DB_${ref.toUpperCase().replace(/-/g, '_')}_*) from your .env file.`,
  })
}