import { readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import type { NitroModule } from 'nitro/types'

// Nitro module that turns the Vercel Build Output config Nitro generates into
// a static-first SPA: every document request is served from the prerendered
// shell on the CDN, and only server functions and API routes invoke the
// function. Nitro's own config sends every non-static path to the function,
// which for a SPA means a function invocation per page view.
//
// Why a module instead of the obvious knobs:
// - `nitro({ hooks: { compiled } })` REPLACES the vercel preset's `compiled`
//   hook (config layers are merged with defu), so `config.json` and
//   `.vc-config.json` are never written. Modules register with
//   `nitro.hooks.hook`, which appends after the preset's hook.
// - `vercel.config.routes` is merged with defu too: user routes land at the
//   top of the array (ahead of Nitro's asset headers and its
//   `handle: filesystem`), Nitro still appends its function catch-all, and
//   the result has a duplicate `handle: filesystem`.
//
// Note: this hook runs before TanStack Start writes `_shell.html`, so the
// shell's existence is asserted afterwards in scripts/verify-build.mjs.

/** Must match `spa.prerender.outputPath` in tanstackStart() (default `/_shell`). */
export const SHELL_PATH = '/_shell.html'
/** Must match `serverFns.base` in tanstackStart() (default `/_serverFn`). */
export const SERVER_FN_BASE = '/_serverFn'
/** Directory under `routes/` that holds the server routes. */
export const API_PREFIX = '/api'

type Route = Record<string, unknown> & {
  src?: string
  dest?: string
  handle?: string
}

/**
 * Rewrites Nitro's generated `routes` so that, after `handle: filesystem`,
 * only `/_serverFn/*` and `/api/*` reach the function, a missing hashed chunk
 * 404s (instead of coming back as the HTML shell, which the browser reports
 * as a MIME error), and everything else is served from the shell.
 *
 * @param assetsPrefix URL prefix of the hashed client chunks (`/assets`, or
 * `/_vercel/immutable/<salt>/nitro` with `vercel.immutableStaticFiles`).
 * @param basePath Router base path (`NEXT_PUBLIC_BASE_PATH`, e.g. `/dashboard`).
 * Pages, API routes and server functions live under it, while the static
 * output stays at the root (Vite `base` is `/` so chunks can use the
 * immutable store), so prefixed rules come first and `public/` files
 * requested under the prefix are rewritten to the root.
 */
export function buildSpaRoutes(
  generated: Route[],
  functionDest: string,
  assetsPrefix: string,
  basePath = ''
) {
  const fsIndex = generated.findIndex((r) => r.handle === 'filesystem')
  if (fsIndex === -1) {
    throw new Error('[vercel-spa-routes] generated config has no { handle: "filesystem" }')
  }
  const before = generated.slice(0, fsIndex)
  const after = generated.slice(fsIndex + 1)

  const isFunctionCatchAll = (r: Route) => r.src === '/(.*)' && r.dest === functionDest
  if (!after.some(isFunctionCatchAll)) {
    throw new Error(
      `[vercel-spa-routes] expected Nitro catch-all { src: "/(.*)", dest: "${functionDest}" } was not found`
    )
  }
  const kept = after.filter((r) => !isFunctionCatchAll(r) && r.handle !== 'filesystem')
  const prefixes = basePath ? [basePath, ''] : ['']

  return [
    ...before,
    { handle: 'filesystem' },
    ...kept,
    ...prefixes.flatMap((prefix) => [
      { src: `${prefix}${SERVER_FN_BASE}/(.*)`, dest: functionDest },
      { src: `${prefix}${API_PREFIX}/(.*)`, dest: functionDest },
    ]),
    { src: `${assetsPrefix}/(.*)`, status: 404 },
    ...(basePath ? [{ src: `${basePath}/(.*\\.\\w+)`, dest: '/$1' }] : []),
    { src: '/(.*)', dest: SHELL_PATH },
  ]
}

export function vercelSpaRoutes({ basePath = '' }: { basePath?: string } = {}): NitroModule {
  return {
    name: 'vercel-spa-routes',
    setup(nitro) {
      if (nitro.options.preset !== 'vercel') return
      nitro.hooks.hook('compiled', async () => {
        const configPath = resolve(nitro.options.output.dir, 'config.json')
        const functionDest = `/${basename(nitro.options.output.serverDir).replace(/\.func$/, '')}`
        const assetsPrefix =
          '/' + (nitro.options.buildAssetsDir || 'assets').replace(/^\/|\/$/g, '')
        const config = JSON.parse(await readFile(configPath, 'utf8'))
        config.routes = buildSpaRoutes(config.routes, functionDest, assetsPrefix, basePath)
        await writeFile(configPath, JSON.stringify(config, null, 2))
        nitro.logger.success(
          `[vercel-spa-routes] documents -> ${SHELL_PATH}, ${basePath}${SERVER_FN_BASE}/* and ${basePath}${API_PREFIX}/* -> ${functionDest}, missing ${assetsPrefix}/* -> 404`
        )
      })
    },
  }
}
