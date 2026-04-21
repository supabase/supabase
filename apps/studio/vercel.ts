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
    // API + server-function passthrough. Both funnel through the single
    // `/api/server` Vercel Function that TanStack Start generates. These
    // must come before the asset rule so that extensioned API paths like
    // `/api/foo.json` still hit the function instead of a filesystem lookup.
    // The destination is un-prefixed because the function is registered at
    // `/api/server` regardless of the app's base path.
    routes.rewrite(`${basePath}/api/(.*)`, '/api/server'),
    routes.rewrite(`${basePath}/_serverFn/(.*)`, '/api/server'),
    // Asset passthrough. Matches anything ending in `.ext` (e.g.
    // `/foo/assets/bundle.abc.js`) and rewrites to the un-prefixed path so
    // Vercel finds it in `dist/client/`. If the file doesn't exist Vercel
    // 404s — important, otherwise missing JS would fall through to the
    // shell rule below and the browser would get HTML where JS was
    // expected.
    routes.rewrite(`${basePath}/(.*\\.\\w+)`, '/$1'),
    // SPA fallback. Every remaining path (including the base path itself)
    // gets served the prerendered shell, which boots the client router. The
    // destination is `/_shell` (no extension) because `cleanUrls: true`
    // makes Vercel key static assets by their clean URL — `_shell.html`
    // lives at `/_shell` in the asset map, so `/_shell.html` wouldn't
    // resolve.
    routes.rewrite(`${basePath}/(.*)`, '/_shell'),
  ],
}

// Belt-and-braces: local @vercel/config CLI reads module.default, but the
// docs claim Vercel's platform looks for a named `config` export. Export
// both so whichever path runs wins.
// eslint-disable-next-line no-restricted-exports
export default config
