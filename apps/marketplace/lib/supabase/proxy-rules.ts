export function shouldBypassAuth(pathname: string) {
  return pathname.startsWith('/auth')
}

export function shouldRedirectToLogin(pathname: string, hasUser: boolean) {
  if (pathname === '/') return false
  if (pathname.startsWith('/login')) return false
  return !hasUser
}
