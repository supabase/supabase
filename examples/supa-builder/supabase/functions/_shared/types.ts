/**
 * Shared TypeScript types for Supabase Edge Functions
 */

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateProjectRequest {
  project_name: string
  organization_id: string
  region: string
  purpose?: string
  description?: string
}

export interface CreateProjectResponse {
  success: boolean
  project_id?: string
  project_ref?: string
  anon_key?: string
  error?: string
  message?: string
}

export interface ErrorResponse {
  success: false
  error: string
  message?: string
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface Project {
  id: string
  project_ref: string
  project_name: string
  organization_id: string
  anon_key: string
  service_role_key_encrypted: string
  region: string
  status: 'provisioning' | 'active' | 'paused' | 'failed' | 'deleted'
  purpose?: string
  description?: string
  creator_id: string
  creator_email: string
  created_at: string
  updated_at: string
  deleted_at?: string
  management_api_response?: Record<string, unknown>
}

export interface UserRole {
  id: string
  user_id: string
  organization_id: string
  role: 'admin' | 'builder'
  assigned_by?: string
  assigned_at: string
}

export interface AuditLog {
  id: string
  project_id: string
  action: 'create' | 'pause' | 'resume' | 'delete' | 'update'
  actor_id: string
  actor_email: string
  organization_id: string
  metadata?: Record<string, unknown>
  created_at: string
}

// ============================================================================
// MANAGEMENT API TYPES
// ============================================================================

export interface ManagementAPICreateProjectRequest {
  name: string
  organization_id: string
  plan: 'free' | 'pro' | 'team' | 'enterprise'
  region: string
  db_pass?: string
}

export interface ManagementAPIProjectResponse {
  id: string
  organization_id: string
  name: string
  region: string
  created_at: string
  database: {
    host: string
    version: string
  }
  status: string
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateCreateProjectRequest(
  data: unknown
): data is CreateProjectRequest {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const req = data as CreateProjectRequest

  return (
    typeof req.project_name === 'string' &&
    req.project_name.length >= 3 &&
    req.project_name.length <= 63 &&
    typeof req.organization_id === 'string' &&
    req.organization_id.length > 0 &&
    typeof req.region === 'string' &&
    req.region.length > 0 &&
    (req.purpose === undefined || typeof req.purpose === 'string') &&
    (req.description === undefined || typeof req.description === 'string')
  )
}

export const VALID_REGIONS = [
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'sa-east-1',
] as const

export type ValidRegion = typeof VALID_REGIONS[number]

export function isValidRegion(region: string): region is ValidRegion {
  return VALID_REGIONS.includes(region as ValidRegion)
}
