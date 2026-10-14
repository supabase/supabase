const ALLOWED_EMAIL_DOMAINS = ['supabase.com', 'supabase.io'] as const

export function isAllowedSupabaseEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at <= 0) return false
  const domain = normalized.slice(at + 1)
  return (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
