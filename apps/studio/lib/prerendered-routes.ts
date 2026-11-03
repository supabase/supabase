/**
 * Signed-out pages prerendered to static HTML on platform builds. One file serves every visitor
 * and every query string, so their first render must not depend on per-visitor state such as
 * search params or storage: read those only once `useHydrated()` is true.
 */
export const PRERENDERED_ROUTES = ['/sign-in', '/sign-up', '/sign-in-sso', '/forgot-password']

export function isPrerenderedRoute(pathname: string) {
  return PRERENDERED_ROUTES.includes(pathname.replace(/\/$/, ''))
}
