const ORGANIZATION_HOME_PATH = /^\/org\/[^/]+\/?$/

export function isOrganizationLandingPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return (
    pathname === '/org' || pathname === '/organizations' || ORGANIZATION_HOME_PATH.test(pathname)
  )
}
