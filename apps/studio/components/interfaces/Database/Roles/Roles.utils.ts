import { SUPABASE_ROLE_PREFIXES, SUPABASE_ROLES } from './Roles.constants'

const SUPABASE_ROLE_NAMES = new Set<string>(SUPABASE_ROLES)

export function isSupabaseRole(name: string) {
  return (
    SUPABASE_ROLE_NAMES.has(name) ||
    SUPABASE_ROLE_PREFIXES.some((prefix) => name.startsWith(prefix))
  )
}
