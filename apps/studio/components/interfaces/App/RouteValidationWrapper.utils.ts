// `org-not-found` must not collide with the OAuth-callback params
// (`error`/`error_description`/`error_code`) that @supabase/auth-js scans for on init
export function buildOrgNotFoundRedirectUrl(home: string, slug: string) {
  return `${home}?org-not-found=${encodeURIComponent(slug)}`
}
