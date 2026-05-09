import fs from 'node:fs'

import { components } from 'api-types'

import {
  POSTGRES_DATABASE,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USER_READ_ONLY,
  POSTGRES_USER_READ_WRITE,
} from './constants'
import { PROJECT_REST_URL } from '@/lib/constants/api'
import { normalizeRefParam } from '@/lib/api/apiHelpers'
import { IS_PLATFORM } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Full configuration for a single self-hosted project. */
export type SelfHostedProject = {
  /** Unique identifier used in URLs: /project/<ref>/... */
  ref: string
  /** Display name shown in the UI */
  name: string
  /** Organization this project belongs to (used to group projects) */
  organizationName: string
  /**
   * Stable numeric ID assigned to this project's organisation.
   * Computed as the 1-based index of the org in the discovered org list.
   */
  organizationId: number
  /**
   * Stable numeric ID for this project.
   * Computed as the 1-based index in the discovered project list.
   */
  id: number
  /** Internal URL of the postgres-meta service (server-side only) */
  pgMetaUrl: string
  /** Internal URL of GoTrue / the Supabase stack (server-side only) */
  supabaseUrl: string
  /** Internal REST URL (server-side only) */
  supabaseRestUrl: string
  /** Public URL exposed to the browser */
  publicSupabaseUrl: string
  anonKey: string
  serviceKey: string
  jwtSecret: string
  postgresHost: string
  postgresPort: number
  postgresPassword: string
  postgresDb: string
  postgresUserReadWrite: string
  postgresUserReadOnly: string
}

type ProjectSettings = components['schemas']['ProjectSettingsResponse'] & {
  app_config?: components['schemas']['ProjectSettingsResponse']['app_config'] & {
    protocol?: string
  }
}

// ---------------------------------------------------------------------------
// File-based config cache (for SUPABASE_PROJECTS_FILE)
// ---------------------------------------------------------------------------

const FILE_CACHE_TTL_MS = 30_000 // 30 seconds

let _fileCache: { projects: SelfHostedProject[]; loadedAt: number } | null = null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derives a stable numeric ID from a list index (1-based). */
function stableId(index: number) {
  return index + 1
}

/**
 * Parses a raw JSON project config entry into a fully resolved SelfHostedProject.
 * All fields have sensible defaults that mirror the legacy single-project env vars.
 */
function parseProjectEntry(
  entry: Record<string, unknown>,
  index: number,
  orgIdByName: Map<string, number>
): SelfHostedProject {
  const orgName = String(entry.organizationName ?? process.env.DEFAULT_ORGANIZATION_NAME ?? 'Default Organization')
  if (!orgIdByName.has(orgName)) {
    orgIdByName.set(orgName, orgIdByName.size + 1)
  }

  const publicUrl = String(entry.publicSupabaseUrl ?? process.env.SUPABASE_PUBLIC_URL ?? 'http://localhost:8000')
  const parsedPublicUrl = (() => {
    try {
      return new URL(publicUrl)
    } catch {
      return new URL('http://localhost:8000')
    }
  })()

  return {
    ref: String(entry.ref ?? 'default'),
    name: String(entry.name ?? process.env.DEFAULT_PROJECT_NAME ?? 'Default Project'),
    organizationName: orgName,
    organizationId: orgIdByName.get(orgName)!,
    id: stableId(index),
    pgMetaUrl: String(entry.pgMetaUrl ?? process.env.STUDIO_PG_META_URL ?? 'http://localhost:8000/pg'),
    supabaseUrl: String(entry.supabaseUrl ?? process.env.SUPABASE_URL ?? 'http://localhost:8000'),
    supabaseRestUrl: String(entry.supabaseRestUrl ?? process.env.SUPABASE_REST_URL ?? `${parsedPublicUrl.origin}/rest/v1/`),
    publicSupabaseUrl: publicUrl,
    anonKey: String(entry.anonKey ?? process.env.SUPABASE_ANON_KEY ?? ''),
    serviceKey: String(entry.serviceKey ?? process.env.SUPABASE_SERVICE_KEY ?? ''),
    jwtSecret: String(entry.jwtSecret ?? process.env.AUTH_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long'),
    postgresHost: String(entry.postgresHost ?? process.env.POSTGRES_HOST ?? POSTGRES_HOST),
    postgresPort: Number(entry.postgresPort ?? process.env.POSTGRES_PORT ?? POSTGRES_PORT),
    postgresPassword: String(entry.postgresPassword ?? process.env.POSTGRES_PASSWORD ?? POSTGRES_PASSWORD),
    postgresDb: String(entry.postgresDb ?? process.env.POSTGRES_DB ?? POSTGRES_DATABASE),
    postgresUserReadWrite: String(entry.postgresUserReadWrite ?? process.env.POSTGRES_USER_READ_WRITE ?? POSTGRES_USER_READ_WRITE),
    postgresUserReadOnly: String(entry.postgresUserReadOnly ?? process.env.POSTGRES_USER_READ_ONLY ?? POSTGRES_USER_READ_ONLY),
  }
}

/**
 * Builds the legacy single-project entry from the classic env vars.
 * This is used as the fallback when neither SUPABASE_PROJECTS nor
 * SUPABASE_PROJECTS_FILE is set.
 */
function buildLegacyProject(): SelfHostedProject {
  return {
    ref: 'default',
    name: process.env.DEFAULT_PROJECT_NAME ?? 'Default Project',
    organizationName: process.env.DEFAULT_ORGANIZATION_NAME ?? 'Default Organization',
    organizationId: 1,
    id: 1,
    pgMetaUrl: process.env.STUDIO_PG_META_URL ?? 'http://localhost:8000/pg',
    supabaseUrl: process.env.SUPABASE_URL ?? 'http://localhost:8000',
    supabaseRestUrl: process.env.SUPABASE_REST_URL ?? PROJECT_REST_URL,
    publicSupabaseUrl: process.env.SUPABASE_PUBLIC_URL ?? 'http://localhost:8000',
    anonKey: process.env.SUPABASE_ANON_KEY ?? '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY ?? '',
    jwtSecret:
      process.env.AUTH_JWT_SECRET ??
      'super-secret-jwt-token-with-at-least-32-characters-long',
    postgresHost: POSTGRES_HOST,
    postgresPort: POSTGRES_PORT,
    postgresPassword: POSTGRES_PASSWORD,
    postgresDb: POSTGRES_DATABASE,
    postgresUserReadWrite: POSTGRES_USER_READ_WRITE,
    postgresUserReadOnly: POSTGRES_USER_READ_ONLY,
  }
}

/**
 * Loads projects from the SUPABASE_PROJECTS JSON env var or from
 * SUPABASE_PROJECTS_FILE (with a 30-second TTL cache). Falls back to
 * a single project derived from the classic env vars.
 */
function loadProjects(): SelfHostedProject[] {
  // 1. Try the JSON env var first.
  const raw = process.env.SUPABASE_PROJECTS
  if (raw) {
    try {
      const entries: Record<string, unknown>[] = JSON.parse(raw)
      if (Array.isArray(entries) && entries.length > 0) {
        const orgIdByName = new Map<string, number>()
        return entries.map((entry, idx) => parseProjectEntry(entry, idx, orgIdByName))
      }
    } catch {
      // Malformed JSON — fall through to file or legacy config.
    }
  }

  // 2. Try the file-based config (SUPABASE_PROJECTS_FILE).
  const filePath = process.env.SUPABASE_PROJECTS_FILE
  if (filePath) {
    const now = Date.now()
    if (_fileCache && now - _fileCache.loadedAt < FILE_CACHE_TTL_MS) {
      return _fileCache.projects
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const entries: Record<string, unknown>[] = JSON.parse(content)
      if (Array.isArray(entries) && entries.length > 0) {
        const orgIdByName = new Map<string, number>()
        const projects = entries.map((entry, idx) => parseProjectEntry(entry, idx, orgIdByName))
        _fileCache = { projects, loadedAt: now }
        return projects
      }
    } catch {
      // File missing or invalid — fall through to legacy.
      if (_fileCache) return _fileCache.projects // use stale cache rather than fail
    }
  }

  // 3. Fall back to the classic single-project env vars.
  return [buildLegacyProject()]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all configured self-hosted projects.
 *
 * _Only call this from server-side self-hosted code._
 */
export function getProjects(): SelfHostedProject[] {
  if (IS_PLATFORM) {
    throw new Error('getProjects() can only be called in self-hosted environments')
  }
  return loadProjects()
}

/**
 * Returns the project for the given ref. Throws a 404-style error when not found.
 *
 * _Only call this from server-side self-hosted code._
 */
export function getProject(ref: string | string[] | undefined): SelfHostedProject {
  if (IS_PLATFORM) {
    throw new Error('getProject() can only be called in self-hosted environments')
  }
  const normalizedRef = normalizeRefParam(ref)
  const project = loadProjects().find((p) => p.ref === normalizedRef)
  if (!project) {
    const err = new Error(`Project '${normalizedRef}' not found`) as Error & { statusCode: number }
    err.statusCode = 404
    throw err
  }
  return project
}

/**
 * Returns the pg-meta URL for the given project ref.
 *
 * _Only call this from server-side self-hosted code._
 */
export function getPgMetaUrlByRef(ref: string | string[] | undefined): string {
  return getProject(ref).pgMetaUrl
}

/**
 * Returns project settings in the format expected by the Studio settings API
 * endpoint for the given project ref.
 *
 * _Only call this from server-side self-hosted code._
 */
export function getProjectSettingsByRef(ref: string | string[] | undefined): ProjectSettings {
  const project = getProject(ref)

  const parsedPublicUrl = (() => {
    try {
      return new URL(project.publicSupabaseUrl)
    } catch {
      return new URL('http://localhost:8000')
    }
  })()

  return {
    app_config: {
      db_schema: 'public',
      endpoint: parsedPublicUrl.host,
      storage_endpoint: parsedPublicUrl.host,
      // manually added to force the frontend to use the correct URL
      protocol: parsedPublicUrl.protocol.replace(':', ''),
    },
    cloud_provider: 'AWS',
    db_dns_name: '-',
    db_host: 'localhost',
    db_ip_addr_config: 'legacy' as const,
    db_name: 'postgres',
    db_port: 5432,
    db_user: 'postgres',
    inserted_at: '2021-08-02T06:40:40.646Z',
    jwt_secret: project.jwtSecret,
    name: project.name,
    ref: project.ref,
    region: 'ap-southeast-1',
    service_api_keys: [
      {
        api_key: project.serviceKey,
        name: 'service_role key',
        tags: 'service_role',
      },
      {
        api_key: project.anonKey,
        name: 'anon key',
        tags: 'anon',
      },
    ],
    ssl_enforced: false,
    status: 'ACTIVE_HEALTHY',
  } satisfies ProjectSettings
}

/**
 * Returns all unique organizations derived from the project registry.
 * Each organization has a stable numeric ID and the projects under it.
 */
export function getOrganizations() {
  const projects = loadProjects()
  const orgsMap = new Map<string, { id: number; name: string }>()

  for (const project of projects) {
    if (!orgsMap.has(project.organizationName)) {
      orgsMap.set(project.organizationName, {
        id: project.organizationId,
        name: project.organizationName,
      })
    }
  }

  return Array.from(orgsMap.values())
}
