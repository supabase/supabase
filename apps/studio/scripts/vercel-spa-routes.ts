import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import type { NitroModule } from 'nitro/types'

// Nitro module that makes the Vercel Build Output a static-first SPA: documents
// are served from the prerendered shell on the CDN and only server functions
// and API routes invoke the function. Nitro's own config sends every
// non-static path to the function.
//
// A module rather than config because `nitro({ hooks: { compiled } })`
// REPLACES the vercel preset's `compiled` hook (config.json is never written),
// and `vercel.config.routes` is defu-merged: user routes land above Nitro's
// `handle: filesystem` while its function catch-all is still appended last.
//
// Runs before TanStack Start writes `_shell.html`.

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

/** A top-level entry of the static output directory. */
export type StaticEntry = { name: string; isDirectory: boolean }

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Matches `${basePath}/<static file>` and captures the root-relative path.
 * Limited to the actual top-level static entries so page deep links whose last
 * segment contains a dot (e.g. a `my.bucket` storage bucket) still fall
 * through to the shell. Directories only match with a trailing path, so a
 * page that shares a directory's name is unaffected.
 */
export function buildStaticFileSrc(basePath: string, entries: StaticEntry[]): string | undefined {
  const dirs = entries.filter((e) => e.isDirectory).map((e) => escapeRegExp(e.name))
  const files = entries.filter((e) => !e.isDirectory).map((e) => escapeRegExp(e.name))
  const alternatives = [
    ...(dirs.length ? [`(?:${dirs.join('|')})/.+`] : []),
    ...(files.length ? [`(?:${files.join('|')})`] : []),
  ]
  if (!alternatives.length) return undefined
  return `^${escapeRegExp(basePath)}/(${alternatives.join('|')})$`
}

/**
 * After `handle: filesystem`: only `/_serverFn/*` and `/api/*` reach the
 * function, a missing hashed chunk 404s instead of becoming the HTML shell,
 * and everything else is the shell.
 *
 * @param assetsPrefix `/assets`, or `/_vercel/immutable/<salt>/nitro` with
 * `vercel.immutableStaticFiles`.
 * @param basePath `NEXT_PUBLIC_BASE_PATH` (e.g. `/dashboard`). Pages, API
 * routes, server functions and browser asset URLs live under it while the
 * static files and immutable store stay at the root. Prefixed rules come
 * first and requests for `staticEntries` under the prefix are rewritten to
 * the root. A rewrite ends routing, so a prefixed request for a missing
 * hashed chunk 404s at its root destination rather than reaching the shell.
 * @param staticEntries Top-level entries of the static output directory.
 */
export function buildSpaRoutes(
  generated: Route[],
  functionDest: string,
  assetsPrefix: string,
  basePath = '',
  staticEntries: StaticEntry[] = []
): Route[] {
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
  const staticFileSrc = basePath ? buildStaticFileSrc(basePath, staticEntries) : undefined

  return [
    ...before,
    { handle: 'filesystem' },
    ...kept,
    ...prefixes.flatMap((prefix) => [
      { src: `${prefix}${SERVER_FN_BASE}/(.*)`, dest: functionDest },
      { src: `${prefix}${API_PREFIX}/(.*)`, dest: functionDest },
    ]),
    { src: `${assetsPrefix}/(.*)`, status: 404 },
    ...(staticFileSrc ? [{ src: staticFileSrc, dest: '/$1' }] : []),
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
        // Includes the immutable asset store (`_vercel`); `_shell.html` is
        // written later but is never requested under the prefix.
        const staticEntries = (
          await readdir(nitro.options.output.publicDir, { withFileTypes: true })
        ).map((entry) => ({ name: entry.name, isDirectory: entry.isDirectory() }))
        const config = JSON.parse(await readFile(configPath, 'utf8'))
        config.routes = buildSpaRoutes(
          config.routes,
          functionDest,
          assetsPrefix,
          basePath,
          staticEntries
        )
        await writeFile(configPath, JSON.stringify(config, null, 2))
        nitro.logger.success(
          `[vercel-spa-routes] documents -> ${SHELL_PATH}, ${basePath}${SERVER_FN_BASE}/* and ${basePath}${API_PREFIX}/* -> ${functionDest}, missing ${assetsPrefix}/* -> 404`
        )
      })
    },
  }
}
