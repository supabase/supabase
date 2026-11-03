/**
 * Signed-out pages that the TanStack build prerenders to static HTML on platform builds, so the
 * first response already holds the page content and its head tags instead of the SPA shell.
 *
 * Read by `vite.config.ts` (what to prerender), `scripts/vercel-spa-routes.ts` (which documents
 * to serve from the prerendered files) and `routes/__root.tsx` (which routes render on the
 * server). Only add pages that render the same for every visitor without a session.
 */
export const PRERENDERED_ROUTES = ['/sign-in', '/sign-up', '/sign-in-sso', '/forgot-password']

export function isPrerenderedRoute(pathname: string) {
  return PRERENDERED_ROUTES.includes(pathname.replace(/\/$/, ''))
}
