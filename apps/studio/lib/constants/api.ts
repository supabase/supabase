const PUBLIC_URL = new URL(process.env.SUPABASE_PUBLIC_URL || 'http://localhost:8000')

// Use LOGFLARE_URL until analytics/v1/ routing is supported
export const PROJECT_ANALYTICS_URL = process.env.LOGFLARE_URL
  ? `${process.env.LOGFLARE_URL}/api/`
  : undefined

export const PROJECT_REST_URL = `${PUBLIC_URL.origin}/rest/v1/`
export const PROJECT_ENDPOINT = PUBLIC_URL.host
export const PROJECT_ENDPOINT_PROTOCOL = PUBLIC_URL.protocol.replace(':', '')

/**
 * @deprecated Use registry-backed endpoints instead.
 * Kept for backward compatibility with non-modified Studio routes only.
 */
export const DEFAULT_PROJECT = {
  id: 1,
  ref: 'default',
  name: process.env.DEFAULT_PROJECT_NAME || 'Default Project',
  organization_id: 1,
  cloud_provider: 'localhost',
  status: 'ACTIVE_HEALTHY',
  region: 'local',
  inserted_at: '2021-08-02T06:40:40.646Z',
}

// ─── Provisioner → Studio shape conversion ───────────────────────────────────

type ProvisionerStatus = 'active' | 'provisioning' | 'error' | 'deleting'

const STATUS_MAP: Record<string, string> = {
  active: 'ACTIVE_HEALTHY',
  provisioning: 'COMING_UP',
  error: 'UNHEALTHY',
  deleting: 'REMOVING',
}

/** Translate provisioner status enum to Studio's uppercase status string. */
export function mapProvisionerStatus(status: unknown): string {
  return STATUS_MAP[String(status)] ?? 'UNKNOWN'
}

type ProvisionerProject = {
  id: string
  name: string
  schema_name: string
  // Accept optional unknown here to handle zod v3/v4 dist type mismatch in the submodule;
  // the status value is always a string at runtime.
  status?: unknown
  created_at: string
}

/** Convert a provisioner Project row to Studio's project shape. */
export function toStudioProject(p: ProvisionerProject) {
  return {
    id: p.id,
    ref: p.name,
    name: p.name,
    schema_name: p.schema_name,
    status: mapProvisionerStatus(p.status),
    inserted_at: p.created_at,
    organization_id: 1,
    cloud_provider: 'localhost',
    region: 'local',
  }
}
