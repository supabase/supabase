import { routes, type Redirect, type VercelConfig } from '@vercel/config/v1'

import {
  getMaintenanceRedirects,
  PLATFORM_REDIRECTS,
  SELF_HOSTED_REDIRECTS,
  SHARED_REDIRECTS,
  type StudioRedirect,
} from './redirects.shared'

// STUDIO_FRAMEWORK gates the TanStack Start deploy. When the env var is
// unset (the default — used by the Next.js prod deploy) this file returns
// an empty `VercelConfig` so Vercel honours the dashboard-configured
// Next.js preset untouched. Vercel reads `vercel.ts` regardless of the
// framework preset (per vercel.com/docs/project-configuration —
// `vercel.ts`'s `framework` field overrides the dashboard preset), so a
// no-op early return is the only way to keep the TanStack rewrites,
// `framework: null`, and `outputDirectory: 'dist/client'` below from
// clobbering the Next build. Set `STUDIO_FRAMEWORK=tanstack` on the
// TanStack Vercel project to opt in.
const isTanstack = process.env.STUDIO_FRAMEWORK === 'tanstack'

// Vite's `base` bakes the prefix into asset URLs but leaves the filesystem
// layout at `dist/client/...`. On Vercel we strip the prefix for file lookups
// and fall through to the SPA shell. When NEXT_PUBLIC_BASE_PATH is empty
// the prefixed rule set is skipped and only the root-level rules fire.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// Build the rewrites + headers for a given prefix ('' for root, or a base
// path like '/dashboard'). We run this once for each prefix and concatenate
// the results so we don't hand-duplicate every rule.
//
// Rewrite ordering: API + server-function passthrough first so extensioned
// API paths (/api/foo.json) don't get caught by the asset rule. Asset rule
// next — it's an identity rewrite that also guards missing files from
// falling through to the shell (a missing .js should 404, not serve HTML).
// Shell rule last, catching everything else.
function routesFor(prefix: string) {
  return {
    rewrites: [
      routes.rewrite(`${prefix}/api/(.*)`, '/api/server'),
      routes.rewrite(`${prefix}/_serverFn/(.*)`, '/api/server'),
      routes.rewrite(`${prefix}/(.*\\.\\w+)`, '/$1'),
      routes.rewrite(`${prefix}/(.*)`, '/_shell'),
    ],
    headers: [
      // Dynamic function responses must not be cached by any shared cache —
      // handlers can still opt in with their own Cache-Control on the
      // Response when a response IS safe to cache.
      routes.cacheControl(`${prefix}/api/(.*)`, { private: true, noStore: true }),
      routes.cacheControl(`${prefix}/_serverFn/(.*)`, { private: true, noStore: true }),
      // Hashed bundles under /assets/* are content-addressed — safe to
      // cache forever.
      routes.cacheControl(`${prefix}/assets/(.*)`, {
        public: true,
        maxAge: '1year',
        immutable: true,
      }),
    ],
  }
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
  // When a base path is configured, emit both the prefixed and root rule
  // sets (prefixed first so it wins for explicit /dashboard/* hits, root as
  // a fallback for bare-domain traffic).
  const ruleSets = (basePath ? [basePath, ''] : ['']).map(routesFor)

  return {
    framework: null,
    outputDirectory: 'dist/client',
    cleanUrls: true,
    redirects: buildRedirects(),
    rewrites: ruleSets.flatMap((r) => r.rewrites),
    headers: ruleSets.flatMap((r) => r.headers),
    // `api/server.js` imports the TanStack SSR bundle via a computed
    // path so Vercel's function bundler doesn't try to statically
    // resolve `dist/server/server.js` during the Next.js prod build
    // (where `dist/` doesn't exist). `includeFiles` ships the SSR
    // output into the function bundle for the TanStack build so the
    // runtime import resolves.
    functions: {
      'api/server.js': {
        includeFiles: 'dist/server/**',
      },
    },
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
