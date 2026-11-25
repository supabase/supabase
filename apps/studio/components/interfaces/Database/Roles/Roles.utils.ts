import { SUPABASE_ROLE_PREFIXES, SUPABASE_ROLES } from './Roles.constants'
import type { PgRole } from '@/data/database-roles/database-roles-query'

const SUPABASE_ROLE_NAMES = new Set<string>(SUPABASE_ROLES)

export function hasSupabaseRolePrefix(name: string) {
  return SUPABASE_ROLE_PREFIXES.some((prefix) => name.startsWith(prefix))
}

export function isSupabaseRole(name: string) {
  return SUPABASE_ROLE_NAMES.has(name) || hasSupabaseRolePrefix(name)
}

// The platform comments each Trusted Partner role with {"_supabase":{"oauth_app_id":...}}
export function isTrustedPartnerRole(comment: string | null) {
  if (!comment) return false
  try {
    return typeof JSON.parse(comment)?._supabase?.oauth_app_id === 'string'
  } catch {
    return false
  }
}

export function isSupabaseManagedRole(role: Pick<PgRole, 'name' | 'comment'>) {
  return isSupabaseRole(role.name) || isTrustedPartnerRole(role.comment)
}
