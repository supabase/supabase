import { routes, type VercelConfig } from '@vercel/config/v1'

// Vite's `base` bakes the prefix into asset URLs but leaves the filesystem
// layout at `dist/client/...`. On Vercel we strip the prefix for file lookups
// and fall through to the SPA shell. When NEXT_PUBLIC_BASE_PATH is empty
// these rules collapse to identity rewrites plus the shell fallback.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const config: VercelConfig = {
  framework: null,
  outputDirectory: 'dist/client',
  cleanUrls: true,
  rewrites: [
    // Prefixed rules — only emitted when a base path is configured. Vite
    // bakes `${basePath}/assets/*` URLs into the HTML, so anything hitting
    // a prefixed path needs to be stripped back to its filesystem location
    // (or routed to the /api/server function).
    ...(basePath
      ? [
          routes.rewrite(`${basePath}/api/(.*)`, '/api/server'),
          routes.rewrite(`${basePath}/_serverFn/(.*)`, '/api/server'),
          routes.rewrite(`${basePath}/(.*\\.\\w+)`, '/$1'),
          routes.rewrite(`${basePath}/(.*)`, '/_shell'),
        ]
      : []),
    // Root-level rules — always emitted. These serve the app at `/` and
    // also cover any paths that don't carry the base-path prefix (handy for
    // health checks, bare-domain hits, or links that forget the prefix).
    //
    // Order matters: API + server-function passthrough first so extensioned
    // API paths (`/api/foo.json`) don't get caught by the asset rule. Asset
    // rule next — it's an identity rewrite that also guards missing files
    // from falling through to the shell (a missing `.js` should 404, not
    // serve HTML). Shell rule last, catching everything else.
    routes.rewrite('/api/(.*)', '/api/server'),
    routes.rewrite('/_serverFn/(.*)', '/api/server'),
    routes.rewrite('/(.*\\.\\w+)', '/$1'),
    routes.rewrite('/(.*)', '/_shell'),
  ],
  // TEMPORARY (testing): force `private, no-store` on every response so
  // nothing (CDN or browser) caches stale content while we iterate. Once
  // the deploy is stable, narrow this back to just the /api/* and
  // /_serverFn/* paths and let the SPA shell + hashed assets take
  // appropriate public cache headers.
  headers: [
    ...(basePath
      ? [routes.cacheControl(`${basePath}/(.*)`, { private: true, noStore: true })]
      : []),
    routes.cacheControl('/(.*)', { private: true, noStore: true }),
  ],
}

// Belt-and-braces: local @vercel/config CLI reads module.default, but the
// docs claim Vercel's platform looks for a named `config` export. Export
// both so whichever path runs wins.
// eslint-disable-next-line no-restricted-exports
export default config
