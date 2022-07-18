export function doesTokenDataExist() {
  // ignore if server-side
  if (typeof window === 'undefined') return false
  // check tokenData on localstorage
  const tokenData = window?.localStorage['supabase.auth.token']
  return tokenData != undefined && typeof tokenData === 'string'
}
