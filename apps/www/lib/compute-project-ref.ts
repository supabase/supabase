const REF_PATTERN = /^[a-z]{20}$/
const PROJECT_HOST_PATTERN =
  /^(?:https?:\/\/)?(?:db\.)?([a-z]{20})(?:\.functions)?\.supabase\.co(?:[/?#:].*)?$/
const DASHBOARD_URL_PATTERN =
  /^(?:https?:\/\/)?(?:www\.|app\.)?supabase\.com\/(?:dashboard\/)?project\/([a-z]{20})(?:[/?#].*)?$/

/**
 * Accepts a bare project ref, a project URL (https://<ref>.supabase.co, plus the
 * db. and .functions hosts), or a dashboard URL
 * (https://supabase.com/dashboard/project/<ref>) and returns the ref, or null if
 * the input matches none of them.
 */
export function parseProjectRef(input: string): string | null {
  const value = input.trim().toLowerCase()
  if (REF_PATTERN.test(value)) return value
  return value.match(PROJECT_HOST_PATTERN)?.[1] ?? value.match(DASHBOARD_URL_PATTERN)?.[1] ?? null
}
