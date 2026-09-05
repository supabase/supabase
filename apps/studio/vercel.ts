import { routes, type Redirect, type VercelConfig } from '@vercel/config/v1'

import {
  getMaintenanceRedirects,
  PLATFORM_REDIRECTS,
  SELF_HOSTED_REDIRECTS,
  SHARED_REDIRECTS,
  type StudioRedirect,
} from './redirects.shared'
import { getSecurityHeaders } from './security-headers'

// STUDIO_FRAMEWORK gates the TanStack Start deploy. When the env var is
// unset (the default — used by the Next.js prod deploy) this file returns
// an empty `VercelConfig` so Vercel honours the dashboard-configured
// Next.js preset untouched. Vercel reads `vercel.ts` regardless of the
// framework preset (per vercel.com/docs/project-configuration —
// `vercel.ts`'s `framework` field overrides the dashboard preset), so a
// no-op early return is the only way to keep `framework: null` and the
// headers below from clobbering the Next build. Set
// `STUDIO_FRAMEWORK=tanstack` on the TanStack Vercel project to opt in.
const isTanstack = process.env.STUDIO_FRAMEWORK === 'tanstack'

// Routing lives in Nitro's Build Output config (`.vercel/output/config.json`,
// shaped by scripts/vercel-spa-routes.ts). Vercel applies this file's
// `redirects`/`headers` ahead of it, which is also why no `rewrites` belong
// here: a catch-all rewrite at this layer swallows the API routes.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// Headers for a given prefix ('' for root, or a base path like '/dashboard').
// Run once per prefix and concatenated so no rule is hand-duplicated.
function headersFor(prefix: string) {
  return [
    // Security headers for every response. The Next build sets these via
    // next.config.ts `headers()`; the TanStack build serves a static shell
    // from the CDN, so they live at the edge. Matches next.config's `/(.*?)`
    // block (CSP, X-Frame-Options, HSTS, etc.).
    { source: `${prefix}/(.*)`, headers: getSecurityHeaders() },
    // Dynamic function responses must not be cached by any shared cache —
    // handlers can still opt in with their own Cache-Control on the
    // Response when a response IS safe to cache.
    routes.cacheControl(`${prefix}/api/(.*)`, { private: true, noStore: true }),
    routes.cacheControl(`${prefix}/_serverFn/(.*)`, { private: true, noStore: true }),
    // Hashed chunks are covered by Nitro (`/_vercel/immutable/*`, immutable).
    // Static images and favicons aren't content-hashed, so they can't be
    // `immutable`, but they change rarely — mirror next.config's
    // `cache-control` for these paths (img: max-age=2592000 = 30 days,
    // favicon: max-age=86400 = 1 day).
    routes.cacheControl(`${prefix}/img/(.*)`, { public: true, maxAge: '30days' }),
    routes.cacheControl(`${prefix}/favicon/(.*)`, { public: true, maxAge: '1day' }),
  ]
}

// ---------------------------------------------------------------------------
// Redirects — entries live in `redirects.shared.ts`, consumed by both
// `next.config.ts` and this file. Next auto-prepends `basePath` to its
// redirects; Vercel doesn't, so we apply it here.
// ---------------------------------------------------------------------------

function applyBasePath(r: StudioRedirect): Redirect {
  if (!basePath) return r
  const prefix = (path: string) =>
    path.startsWith('/') ? (path === '/' ? basePath : `${basePath}${path}`) : path
  return { ...r, source: prefix(r.source), destination: prefix(r.destination) }
}

function buildRedirects(): Redirect[] {
  const isPlatform = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
  const maintenance = process.env.MAINTENANCE_MODE === 'true'
  const conditional = isPlatform ? PLATFORM_REDIRECTS : SELF_HOSTED_REDIRECTS

  // Bare-domain bounce to the basePath when one is configured. Source
  // stays literally `/` (NOT prefixed) so the entry-point redirect fires.
  const basePathBounce: Redirect[] = basePath
    ? [{ source: '/', destination: basePath, permanent: false }]
    : []

  return [
    ...conditional.map(applyBasePath),
    ...SHARED_REDIRECTS.map(applyBasePath),
    ...basePathBounce,
    ...getMaintenanceRedirects(maintenance).map(applyBasePath),
  ]
}

function buildTanstackConfig(): VercelConfig {
  // Vercel's Flags Explorer probes `/.well-known/vercel/flags` and expects
  // JSON. next.config.ts proxies it to supabase.com's endpoint and forces
  // `content-type: application/json`; mirror that here. It lives at the domain
  // root (once, NOT per prefix) because next.config's rewrite sets
  // `basePath: false` — well-known URLs are at the root regardless of the
  // app's basePath.
  const wellKnownFlags = '/.well-known/vercel/flags'

  return {
    // Nitro's Build Output directory is what gets deployed; no framework
    // preset should route on top of it.
    framework: null,
    redirects: buildRedirects(),
    rewrites: [routes.rewrite(wellKnownFlags, `https://supabase.com${wellKnownFlags}`)],
    headers: [
      routes.header(wellKnownFlags, [{ key: 'content-type', value: 'application/json' }]),
      // When a base path is configured, emit both the prefixed and root rule
      // sets (prefixed first so it wins for explicit /dashboard/* hits, root
      // as a fallback for bare-domain traffic).
      ...(basePath ? [basePath, ''] : ['']).flatMap(headersFor),
    ],
  }
}

// Empty config = no overrides; Vercel falls back to the dashboard preset.
const passthrough: VercelConfig = {}

export const config: VercelConfig = isTanstack ? buildTanstackConfig() : passthrough

// Belt-and-braces: local @vercel/config CLI reads module.default, but the
// docs claim Vercel's platform looks for a named `config` export. Export
// both so whichever path runs wins.
// eslint-disable-next-line no-restricted-exports
export default config
