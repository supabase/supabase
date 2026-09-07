import { execSync } from 'child_process'
import type { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getDatabaseByRef } from '@/lib/api/self-hosted/registry'

export type ProjectStatus = 'ACTIVE_HEALTHY' | 'COMING_UP' | 'INACTIVE' | 'UNKNOWN'

export interface ProjectStatusResponse {
  ref: string
  status: ProjectStatus
  containers: ContainerStatus[]
}

interface ContainerStatus {
  name: string
  state: string
  health: string | null
}

function getContainerStatuses(ref: string): ContainerStatus[] {
  // Services that should exist for this project
  const services = [`db-${ref}`, `auth-${ref}`, `rest-${ref}`, `storage-${ref}`]
  // Default ref uses the original service names
  const isDefault = ref === 'default'
  const names = isDefault
    ? ['supabase-db', 'supabase-auth', 'supabase-rest', 'supabase-storage']
    : services

  const results: ContainerStatus[] = []

  for (const name of names) {
    try {
      // docker inspect returns JSON with State info
      const raw = execSync(
        `docker inspect --format '{"name":"{{.Name}}","state":"{{.State.Status}}","health":"{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}"}' ${name}`,
        { timeout: 5000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim()

      const parsed = JSON.parse(raw.replace(/^\//, s => `{"name":"${name.replace(/^\//, '')}"}`).replace(/^\{"name":"\//, '{"name":"'))
      results.push({
        name,
        state: parsed.state ?? 'unknown',
        health: parsed.health === 'none' ? null : (parsed.health ?? null),
      })
    } catch {
      results.push({ name, state: 'not_found', health: null })
    }
  }

  return results
}

function deriveStatus(containers: ContainerStatus[]): ProjectStatus {
  if (containers.length === 0) return 'UNKNOWN'

  const states = containers.map((c) => c.state)
  const healths = containers.map((c) => c.health).filter(Boolean)

  // All running and healthy → ACTIVE_HEALTHY
  const allRunning = states.every((s) => s === 'running')
  const anyUnhealthy = healths.some((h) => h === 'unhealthy')
  const anyStarting = healths.some((h) => h === 'starting')
  const allHealthy = healths.length > 0 && healths.every((h) => h === 'healthy')

  if (allRunning && allHealthy) return 'ACTIVE_HEALTHY'
  if (allRunning && anyStarting) return 'COMING_UP'
  if (allRunning && !anyUnhealthy) return 'COMING_UP'
  if (states.every((s) => s === 'not_found' || s === 'exited')) return 'INACTIVE'
  return 'UNKNOWN'
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: false })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const { ref } = req.query as { ref: string }
  const db = getDatabaseByRef(ref)

  if (!db && ref !== 'default') {
    return res.status(404).json({ error: `Project "${ref}" not found in registry` })
  }

  let containers: ContainerStatus[] = []
  try {
    containers = getContainerStatuses(ref)
  } catch {
    // docker not available or not running — treat as unknown
  }

  const status = deriveStatus(containers)

  return res.status(200).json({
    ref,
    status,
    containers,
  } satisfies ProjectStatusResponse)
}