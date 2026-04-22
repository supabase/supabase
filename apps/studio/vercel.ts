import { routes, type VercelConfig } from '@vercel/config/v1'

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

// When a base path is configured, emit both the prefixed and root rule
// sets (prefixed first so it wins for explicit /dashboard/* hits, root as
// a fallback for bare-domain traffic).
const ruleSets = (basePath ? [basePath, ''] : ['']).map(routesFor)

export const config: VercelConfig = {
  framework: null,
  outputDirectory: 'dist/client',
  cleanUrls: true,
  rewrites: ruleSets.flatMap((r) => r.rewrites),
  headers: ruleSets.flatMap((r) => r.headers),
}

// Belt-and-braces: local @vercel/config CLI reads module.default, but the
// docs claim Vercel's platform looks for a named `config` export. Export
// both so whichever path runs wins.
// eslint-disable-next-line no-restricted-exports
export default config
