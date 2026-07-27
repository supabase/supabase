/* eslint-disable no-restricted-exports */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import remapping, { type SourceMapInput } from '@jridgewell/remapping'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import MagicString from 'magic-string'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const compatRoot = path.resolve(rootDir, 'compat/next')

// Absolute dir of lodash-es, for the SSR-only lodash alias below. Resolved
// here (not left as a bare 'lodash-es' replacement) because rollup-alias
// rewrites the id but resolution still runs from the ORIGINAL importer —
// under pnpm's strict node_modules, workspace packages that don't declare
// lodash-es (ui, common) would fail to resolve the bare specifier.
const lodashEsDir = path.dirname(createRequire(import.meta.url).resolve('lodash-es/package.json'))

// Map of Next imports we've shimmed to their TanStack-backed replacement.
// Add an entry here + a file under compat/next/ when a new Next surface is
// needed by app source.
const nextShims: Record<string, string> = {
  'next/compat/router': path.join(compatRoot, 'compat/router.ts'),
  'next/dynamic': path.join(compatRoot, 'dynamic.tsx'),
  'next/head': path.join(compatRoot, 'head.tsx'),
  'next/image': path.join(compatRoot, 'image.tsx'),
  'next/legacy/image': path.join(compatRoot, 'legacy/image.tsx'),
  'next/link': path.join(compatRoot, 'link.tsx'),
  'next/navigation': path.join(compatRoot, 'navigation.ts'),
  'next/router': path.join(compatRoot, 'router.ts'),
  'next/script': path.join(compatRoot, 'script.tsx'),
  'next/server': path.join(compatRoot, 'server.ts'),
}

// Combined compat + migration guard:
// - If app source imports a shimmed `next/*` id, resolve it to the local
//   shim (acts like resolve.alias).
// - Otherwise, if app source imports from `next` or `next/*`, fail the
//   build so we catch unshimmed usage at build time during the migration.
// - node_modules imports (e.g. @sentry/nextjs reaching into next) pass
//   through untouched.
function nextCompat(): Plugin {
  return {
    name: 'studio-next-compat',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!importer || importer.includes('/node_modules/')) return
      if (nextShims[id]) return nextShims[id]
      if (id === 'next' || id.startsWith('next/')) {
        throw new Error(
          `[next-compat] "${id}" imported from ${importer}.\n` +
            `Add a shim under apps/studio/compat/next/ and register it in vite.config.ts, ` +
            `or use a framework-agnostic equivalent.`
        )
      }
    },
  }
}

// Import specifiers (as they appear in app source) for files that import as
// raw text but whose extension the bundler would otherwise treat as code —
// the Deno typings that `components/ui/AIEditor` feeds to Monaco as extra
// libs. Deliberately an exact-specifier allowlist — do NOT widen to
// `*.d.ts`: hijacking declaration-file resolution globally would corrupt
// every package that ships `.d.ts` next to its JS.
const RAW_TEXT_SPECIFIERS: Record<string, string> = {
  '@/public/deno/edge-runtime.d.ts': path.join(rootDir, 'public/deno/edge-runtime.d.ts'),
  '@/public/deno/lib.deno.d.ts': path.join(rootDir, 'public/deno/lib.deno.d.ts'),
}

// `\0`-prefixed so the Rolldown dep scanner externalizes the module instead
// of descending into it (see `shouldExternalizeDep` in vite); `.js`-suffixed
// so no TS transform ever sees a `.d.ts`-looking id.
const RAW_TEXT_PREFIX = '\0studio-raw-text:'
const RAW_TEXT_SUFFIX = '.js'

// Mirror the raw-loader rules from next.config.ts: serve `*.md` files (used
// by `static-data/integrations/*/overview.md` via
// `static-data/integrations/overviews.ts`) and the Deno typings in
// `public/deno/*.d.ts` as JS modules whose default export is the file's
// text. Vite has `?raw` for this, but the query suffix would have to live
// in shared app source where it breaks the webpack/turbopack raw-loader
// rule, so the import specifiers stay query-free and this plugin does the
// conversion for the Vite pipeline.
//
// The `.d.ts` files can't go through a plain `transform` like the `.md`
// files do: the dep scanner's native scan pipeline skips JS transform/load
// hooks entirely and parses whatever the id resolves to, and raw TS
// *declaration* syntax (`get stdin(): WritableStream;`) is a parse error in
// its runtime-TS grammar — the whole dependency scan fails and Vite skips
// pre-bundling outright. Resolving the specifier to a `\0`-virtual id keeps
// the scanner out (it externalizes `\0` ids) and the `load` hook then
// serves the file's text for the real pipelines (dev, build, SSR).
function rawTextLoader(): Plugin {
  return {
    name: 'studio-raw-text-loader',
    enforce: 'pre',
    resolveId(id) {
      const file = RAW_TEXT_SPECIFIERS[id]
      if (file) return RAW_TEXT_PREFIX + file + RAW_TEXT_SUFFIX
    },
    load(id) {
      if (!id.startsWith(RAW_TEXT_PREFIX)) return
      const file = id.slice(RAW_TEXT_PREFIX.length, -RAW_TEXT_SUFFIX.length)
      const content = fs.readFileSync(file, 'utf-8')
      return { code: `export default ${JSON.stringify(content)}`, map: null }
    },
    transform(code, id) {
      if (!id.endsWith('.md')) return
      return { code: `export default ${JSON.stringify(code)}`, map: null }
    },
  }
}

// Swap graphiql's webpack worker setup for its Vite one in client builds.
//
// App source imports `graphiql/setup-workers/webpack` (GraphiQLTab.tsx),
// which registers `MonacoEnvironment.getWorker` using
// `new Worker(new URL('monaco-editor/...', import.meta.url))` — the URL form
// webpack/turbopack rewrites at build time. Vite doesn't rewrite bare module
// specifiers inside `new URL(..., import.meta.url)`, so under the TanStack
// build the worker URLs 404 and Monaco falls back to running the json /
// editorWorkerService / graphql workers on the main thread ("Could not
// create web worker(s)..." console warning). graphiql also ships
// `setup-workers/vite`, which imports the same three workers via Vite's
// `?worker` suffix; importing that unconditionally would break the Next
// build, so the swap happens here instead of in app source.
//
// SSR resolution is left untouched: neither variant's `getWorker` ever runs
// during SSR, and the webpack flavor is a plain global assignment while the
// vite flavor's `?worker` imports don't belong in the server graph.
function graphiqlViteWorkers(): Plugin {
  return {
    name: 'studio-graphiql-vite-workers',
    enforce: 'pre',
    resolveId(id, importer, options) {
      if (id !== 'graphiql/setup-workers/webpack' || options.ssr) return
      return this.resolve('graphiql/setup-workers/vite', importer, { skipSelf: true })
    },
  }
}

// Short-circuit UMD wrappers' AMD branch by string-replacing the
// `define.amd` check. Vite's `config.define` doesn't reach pre-bundled
// deps (Vite 8's Rolldown-based optimizer doesn't honour member-
// expression define keys at the prebundle stage), and adding the same
// substitution to `optimizeDeps.rolldownOptions.define` had no effect
// on the emitted `node_modules/.vite/deps/*.js`. This transform fires
// when Vite *serves* the prebundled file, rewriting the runtime AMD
// check before it reaches the browser.
//
// Applied broadly to any module containing the AMD check (not just
// papaparse) — UMD wrappers all share the same shape, and we never
// want to take the AMD branch when Monaco's loader is around.
//
// Surfaces concretely on /functions/[slug]/invocations: papaparse
// pre-bundled into `.vite/deps/papaparse.js` retained the literal
// `"function" == typeof define && define.amd` check; Monaco's CDN
// loader installs `window.define` first, so papaparse's UMD takes the
// AMD branch and calls an anonymous `define([], t)` that Monaco
// rejects with "Can only have one anonymous define call per script
// file".
function umdAmdShortCircuit(): Plugin {
  // Matches both unminified (`typeof define === 'function' && define.amd`)
  // and minified (`"function" == typeof define && define.amd`) forms of
  // the UMD AMD-detection check.
  const AMD_CHECK_PATTERNS = [
    /typeof\s+define\s*===?\s*['"]function['"]\s*&&\s*define\.amd/g,
    /['"]function['"]\s*===?\s*typeof\s+define\s*&&\s*define\.amd/g,
  ]

  // Only short-circuit when `define` is the *global* AMD loader (Monaco's
  // CDN loader) — that's the one we never want UMD wrappers to register
  // against. Some vendored bundles install their own *local* `define` shim
  // and rely on the AMD branch to capture their exports:
  // `monaco-editor/esm/vs/base/common/marked/marked.js` (pulled in by
  // @graphiql/react's bundled Monaco) wraps marked's UMD in
  // `function define(deps, factory) { factory(__marked_exports) }` and its
  // ESM tail reads `__marked_exports.X || exports.X`. Replacing the check
  // with a bare `false` diverts the factory to the global-object branch,
  // leaving `__marked_exports` empty, and the tail's `exports.X` fallback
  // then throws `ReferenceError: exports is not defined` — the GraphiQL
  // editor pane never mounts. The `define !== globalThis.define` guard
  // keeps such local AMD shims working while still disarming the global
  // one. (The operand order — guard *before* `define.amd` — also ensures
  // the emitted expression can never re-match AMD_CHECK_PATTERNS.)
  const AMD_CHECK_REPLACEMENT =
    '(typeof define === "function" && define !== globalThis.define && define.amd)'

  return {
    name: 'studio-umd-amd-short-circuit',
    enforce: 'pre',
    transform(code, id) {
      if (!code.includes('define.amd')) return
      // Skip Monaco's loader.js if it ever ends up in our graph — it
      // legitimately needs `define.amd` to register itself as AMD.
      if (id.includes('monaco-editor/min/vs/loader')) return
      let next = code
      for (const pattern of AMD_CHECK_PATTERNS) {
        next = next.replace(pattern, AMD_CHECK_REPLACEMENT)
      }
      if (next === code) return
      return { code: next, map: null }
    },
  }
}

// Replace our `components/interfaces/GraphQL/GraphiQL` module with a no-op
// React component in SSR builds only.
//
// `@graphiql/react` transitively loads a codemirror addon that touches
// `document` at module-evaluation time. During the SPA shell prerender,
// that hard-crashes with "document is not defined" as soon as the graphiql
// chunk gets loaded.
//
// Stubbing `@graphiql/react` directly would require enumerating its 30+ named
// exports so Rolldown's static analysis is satisfied. Easier to stub the one
// internal consumer — `GraphiQL.tsx` only exposes a default-export component,
// and no SSR-reachable route renders it (the GraphiQL tab is client-only).
// SSR-only lodash → lodash-es rewrite, for the whole SSR module graph (app
// source, workspace packages, and node_modules deps alike). The CJS lodash
// in `ssr.noExternal` evaluates as pure ESM in the dev module runner — no
// `module`/`exports`/`require` — so its UMD wrapper silently attaches `_` to
// the global and every named import binds to `undefined`, exploding only when
// first CALLED during SSR render ("(0, __vite_ssr_import_0__.isEqual) is not
// a function"). Deep imports (`lodash/isEqual`) fail harder: their plain-CJS
// `require` throws "require is not defined". lodash-es is the same version as
// real ESM, so both import styles just work. Client bundles are untouched —
// resolution is gated on `options.ssr`, and the Next build doesn't read this
// config.
function ssrLodashEs(): Plugin {
  return {
    name: 'studio-ssr-lodash-es',
    enforce: 'pre',
    resolveId(source, _importer, options) {
      if (!options?.ssr) return
      if (source === 'lodash') return path.join(lodashEsDir, 'lodash.js')
      const subpath = source.match(/^lodash\/(.+?)(\.js)?$/)
      if (subpath) return path.join(lodashEsDir, `${subpath[1]}.js`)
    },
  }
}

function ssrStubGraphiql(): Plugin {
  return {
    name: 'studio-ssr-stub-graphiql',
    enforce: 'pre',
    transform(_code, id, options) {
      if (!options?.ssr) return
      if (id.endsWith('/components/interfaces/GraphQL/GraphiQL.tsx')) {
        return { code: 'export default function GraphiQLStub() { return null }', map: null }
      }
    },
  }
}

// Build-time guard: scan the emitted client chunks for cross-chunk
// circular imports and fail the build if any are found. Catches the
// class of bug that produces runtime errors like
// "TypeError: <name> is not a function" at module load — when chunk
// A imports a binding from chunk B and B (transitively) imports A
// back, ES module live-bindings can be undefined at the point the
// chunk that evaluates first tries to use them.
//
// Cycles are matched by chunk basename prefix (stripping the
// `assets/` directory and the `-<hash>.js` suffix), so the allowlist
// stays stable across builds even as Rolldown reassigns hashes.
const KNOWN_CHUNK_CYCLES: ReadonlyArray<ReadonlyArray<string>> = [
  // `ui` ↔ `TreeView` chunk cycle. `cva` lives in the `ui` chunk
  // (Rolldown pools it there because many ui files use it), TreeView
  // imports `cva` back from `ui` while `ui`'s barrel re-exports
  // TreeView — runtime crash is "cva is not a function" at SSR.
  // Worked around via the `class-variance-authority` manualChunks
  // pin below; the chunk graph still surfaces the SCC even though
  // the top-level `cva(...)` call inside TreeView no longer crashes.
  // The variants below are the same SCC in different shapes — they
  // shuffle as Rolldown re-chunks across merges.
  ['LoadingLine', 'TreeView', 'ui'],
  ['FormLayout', 'LoadingLine', 'TreeView', 'ui', 'index'],
  ['LoadingLine', 'TreeView', 'ui', 'index'],
]

function chunkPrefix(name: string): string {
  return name
    .replace(/^assets\//, '')
    .replace(/-[A-Za-z0-9_-]{6,10}\.js$/, '')
    .replace(/\.js$/, '')
}

function isKnownCycle(scc: string[]): boolean {
  const prefixes = new Set(scc.map(chunkPrefix))
  return KNOWN_CHUNK_CYCLES.some(
    (known) => known.length === prefixes.size && known.every((p) => prefixes.has(p))
  )
}

function assertNoChunkCycles(): Plugin {
  return {
    name: 'studio-assert-no-chunk-cycles',
    apply: 'build',
    generateBundle(_options, bundle) {
      const graph: Record<string, Set<string>> = {}
      for (const [name, asset] of Object.entries(bundle)) {
        if (asset.type !== 'chunk') continue
        graph[name] = new Set(asset.imports.filter((i) => i in bundle))
      }

      // Tarjan's strongly-connected-components algorithm. Any SCC with
      // more than one node is a cycle in the output chunk graph.
      const indices: Record<string, number> = {}
      const lowlinks: Record<string, number> = {}
      const onStack: Record<string, boolean> = {}
      const stack: string[] = []
      const sccs: string[][] = []
      let nextIndex = 0

      const strongconnect = (v: string) => {
        indices[v] = nextIndex
        lowlinks[v] = nextIndex
        nextIndex++
        stack.push(v)
        onStack[v] = true
        for (const w of graph[v] || []) {
          if (indices[w] === undefined) {
            strongconnect(w)
            lowlinks[v] = Math.min(lowlinks[v], lowlinks[w])
          } else if (onStack[w]) {
            lowlinks[v] = Math.min(lowlinks[v], indices[w])
          }
        }
        if (lowlinks[v] === indices[v]) {
          const scc: string[] = []
          let w: string | undefined
          do {
            w = stack.pop()
            if (w === undefined) break
            onStack[w] = false
            scc.push(w)
          } while (w !== v)
          if (scc.length > 1) sccs.push(scc)
        }
      }

      for (const v of Object.keys(graph)) {
        if (indices[v] === undefined) strongconnect(v)
      }

      const unexpected = sccs.filter((scc) => !isKnownCycle(scc))
      if (unexpected.length === 0) return

      const summary = unexpected
        .map((scc, i) => `  Cycle ${i + 1}:\n` + scc.map((c) => `    ${c}`).join('\n'))
        .join('\n\n')
      const msg =
        `studio-assert-no-chunk-cycles: detected ${unexpected.length} new chunk-level cycle(s) in the client bundle.\n` +
        `These cause "X is not a function" runtime errors at module-load time. ` +
        `Either restructure the modules involved or add the cycle to KNOWN_CHUNK_CYCLES ` +
        `in apps/studio/vite.config.ts.\n\n` +
        summary
      this.error(msg)
    },
  }
}

// Skew protection (vercel.com/docs/skew-protection): bake `?dpl=<deployment
// id>` into every asset URL the client bundle can request, so every hashed
// chunk resolves against the deployment that referenced it. Vercel's edge
// routes any request carrying `?dpl=` to that exact deployment, so a
// long-lived dashboard session keeps loading its own deployment's hashed
// chunks after a redeploy, while document navigations (which carry no pin)
// always land on the latest deployment. If the pinned deployment ages out of
// Skew Protection's Maximum Age, Vercel 404s the chunk and the
// `vite:preloadError` backstop in router.tsx reloads onto the latest deploy.
// API / server-function fetches are deliberately unpinned — that is what
// lets use-check-latest-deploy detect newer deploys mid-session.
//
// Three mechanisms are needed for full coverage:
//   1. `experimental.renderBuiltUrl` (in the config below) — asset and
//      public-file URLs referenced from JS/CSS/HTML, including the
//      `__vite__mapDeps` preload lists for dynamic imports.
//   2. The `generateBundle` hook here — chunk-to-chunk `import`/`from`
//      specifiers. Rolldown renders these as bare relative paths that
//      `renderBuiltUrl` never sees (vitejs/vite#13834), and they're what the
//      browser actually fetches; the preload list alone would just warm a
//      cache entry under a different URL. Module identity is keyed by URL, so
//      the rewrite must cover EVERY specifier or a chunk could load twice
//      (pinned + unpinned) and break singleton module state.
//   3. The `buildApp` hook here — `_shell.html` is prerendered by TanStack's
//      own post-order `buildApp` hook from the router manifest, outside
//      Vite's asset pipeline, so its <script>/<link> URLs and the embedded
//      route-preload manifest are patched on disk afterwards. Without this,
//      the shell's unpinned modulepreload URLs and the pinned import URLs are
//      different cache keys and the whole entry graph downloads twice.
function skewProtectionDpl(opts: { dplSearch: string; assetsUrlPrefix: string }): Plugin {
  const { dplSearch, assetsUrlPrefix } = opts
  return {
    name: 'studio-skew-protection-dpl',
    apply: 'build',
    // TanStack's `tanstack-start-core:post-build` plugin is `enforce: 'post'`;
    // matching it keeps THIS plugin sorted after it (same enforce group,
    // registration order wins), which the buildApp hook below relies on.
    enforce: 'post',
    transform: {
      handler(code, id) {
        if (id !== '\0vite/preload-helper.js') return
        // Vite's preload helper decides stylesheet-vs-modulepreload with
        // `dep.endsWith(".css")`. The `?dpl=` suffix makes that false for
        // every CSS dep, so lazy chunks' CSS would be injected as a script
        // modulepreload — a console MIME error, and the stylesheet never
        // applies. Make the check query-aware. Hard-fail if the helper's
        // shape ever changes so a Vite upgrade can't silently regress this.
        const cssCheck = 'dep.endsWith(".css")'
        if (!code.includes(cssCheck)) {
          this.error(
            `studio-skew-protection-dpl: expected \`${cssCheck}\` in vite's preload helper — ` +
              `vite changed its preload-helper shape; update this patch to match.`
          )
        }
        return { code: code.replaceAll(cssCheck, '/\\.css(\\?|$)/.test(dep)'), map: null }
      },
    },
    generateBundle: {
      // `order: 'post'` so this runs AFTER `vite:build-import-analysis`'s
      // normal-order generateBundle. That hook maps each dynamic-import
      // specifier back to a bundle key — with no query stripping — to collect
      // the chunk's CSS/preload deps; a `?dpl` suffix added any earlier makes
      // the lookup miss and silently drops CSS preloading for lazy chunks.
      order: 'post',
      handler(_options, bundle) {
        // Server chunks import each other via Node's filesystem resolution —
        // only the browser-facing client build gets the query pin.
        if (this.environment.name !== 'client') return
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue
          const importees = new Set([...chunk.imports, ...chunk.dynamicImports])
          if (importees.size === 0) continue
          const chunkDir = path.posix.dirname(chunk.fileName)
          let edits: MagicString | undefined
          for (const importee of importees) {
            const rel = path.posix.relative(chunkDir, importee)
            const spec = rel.startsWith('.') ? rel : `./${rel}`
            // Rolldown quotes static import specifiers with `"` and dynamic
            // ones with backticks; cover `'` too for safety. Matching the
            // exact quoted specifier of a known importee (hashed filename)
            // can't collide with app string literals.
            for (const quote of ['"', "'", '`']) {
              const target = `${quote}${spec}${quote}`
              for (
                let at = chunk.code.indexOf(target);
                at !== -1;
                at = chunk.code.indexOf(target, at + target.length)
              ) {
                edits ??= new MagicString(chunk.code)
                edits.appendLeft(at + target.length - 1, dplSearch)
              }
            }
          }
          if (!edits) continue
          chunk.code = edits.toString()
          // Recombine the sourcemap so the columns Sentry maps stay accurate
          // — every insertion shifts the rest of the minified line. Like
          // vite:build-import-analysis's own generateBundle edits, updating
          // `chunk.map` isn't enough: the `.js.map` file already exists in
          // the bundle as an emitted asset by this point, so the combined map
          // has to be written into that asset too.
          if (chunk.map) {
            const editMap = edits.generateMap({ source: chunk.fileName, hires: 'boundary' })
            const original = chunk.map as unknown as SourceMapInput & {
              file?: string
              debugId?: string
            }
            const combined = {
              ...remapping([editMap as SourceMapInput, original], () => null),
              // Preserve fields remapping drops but the toolchain relies on
              // (`debugId` is how Sentry pairs the uploaded map to the chunk).
              file: original.file,
              ...(original.debugId && { debugId: original.debugId }),
            }
            chunk.map = combined as unknown as typeof chunk.map
            const mapAsset = bundle[`${chunk.fileName}.map`]
            if (mapAsset && mapAsset.type === 'asset') {
              mapAsset.source = JSON.stringify(combined)
            }
          }
        }
      },
    },
    buildApp: {
      // TanStack's `tanstack-start-core:post-build` prerenders `_shell.html`
      // in its own post-order buildApp hook. This hook must run after it, so
      // this plugin must sort after that one: same hook order + same plugin
      // `enforce` group (see above) + registered after `tanstackStart()` in
      // the plugins array.
      order: 'post',
      async handler(builder) {
        const clientEnv = builder.environments.client
        if (!clientEnv) return
        const outDir = path.resolve(builder.config.root, clientEnv.config.build.outDir)
        const escapedPrefix = assetsUrlPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Quoted `/assets/...` URLs: <script src>/<link href> attributes and
        // the serialized router manifest's preload lists. `[^"'`?]` keeps the
        // match inside one URL and skips any that already carry a query.
        const assetUrl = new RegExp(`(["'\`])(${escapedPrefix}[^"'\`?]+)\\1`, 'g')
        for (const entry of fs.readdirSync(outDir, { recursive: true, withFileTypes: true })) {
          if (!entry.isFile() || !entry.name.endsWith('.html')) continue
          const filePath = path.join(entry.parentPath, entry.name)
          const html = fs.readFileSync(filePath, 'utf-8')
          const patched = html.replace(assetUrl, (_match, quote, url) => {
            return `${quote}${url}${dplSearch}${quote}`
          })
          if (patched !== html) fs.writeFileSync(filePath, patched)
        }
      },
    },
  }
}

export default defineConfig(({ command, mode }) => {
  // Match Next's "always production-NODE_ENV during build" behaviour.
  // `pnpm run e2e:setup:selfhosted` invokes the build with a shell
  // `NODE_ENV=test` so Next can pick up `.env.test` for env loading;
  // Next overrides NODE_ENV back to 'production' internally before
  // emitting code, so the bundle never sees 'test'. Vite respects the
  // user's NODE_ENV by default and would bake `process.env.NODE_ENV ===
  // 'test'` into the client bundle, which trips vitest-only code paths
  // (notably `API_URL` in `lib/constants/index.ts` pointing the browser
  // at the vitest MSW host on port 3000, breaking every API fetch in
  // e2e). Override here so `--mode test` still loads `.env.test` (via
  // Vite's mode-based env resolution) while the bundle stays at
  // `NODE_ENV='production'`, mirroring Next.
  if (command === 'build') {
    // Next's types declare NODE_ENV as read-only, so cast to assign it.
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
  } else if (process.env.NODE_ENV === 'test') {
    // `pnpm dev:studio-local` runs with a shell NODE_ENV=test (the Next
    // path needs it to load `.env.test`), and Vite's
    // define plugin inlines `process.env.NODE_ENV || mode` into the client —
    // which would bake 'test' in and trip the vitest-only API_URL path.
    // `next dev` always runs the bundle at 'development' regardless of the
    // shell NODE_ENV; mirror that. Env-file selection is unaffected — the
    // vite dev path selects `.env.test` via MODE=test (see envMode below),
    // not NODE_ENV.
    ;(process.env as Record<string, string>).NODE_ENV = 'development'
  }

  // `pnpm dev:studio-local` needs the `.env.test` cascade (self-hosted mode
  // plus the supabase-cli keys that generateLocalEnv.js writes) — the Next
  // path selects it via NODE_ENV=test, and the tanstack build via
  // `--mode test` (e2e:setup:selfhosted). But `vite dev --mode test` is not
  // an option: TanStack Start's dev-server plugin treats mode 'test' as
  // "running under vitest" and skips installing its SSR middleware entirely,
  // so every route 404s (see the `isTest` guard in devServerPlugin,
  // @tanstack/start-plugin-core). So dev keeps mode 'development' and
  // emulates the env cascade of the mode named by MODE instead: load it for
  // the NEXT_PUBLIC_* defines below, and seed process.env for the SSR
  // runtime. The seeding must not clobber shell-provided values (matching
  // serve.js), and survives TanStack's own load-env plugin: that plugin
  // Object.assigns loadEnv(mode) at configResolved — after this runs — and
  // loadEnv gives existing process.env values priority over env-file values.
  const envMode = command === 'serve' && process.env.MODE ? process.env.MODE : mode

  // Inline NEXT_PUBLIC_* env vars at build time so `process.env.NEXT_PUBLIC_*`
  // works in the browser bundle (mirrors Next.js behaviour).
  const env = loadEnv(envMode, rootDir, '')

  if (envMode !== mode) {
    const processEnv = process.env as Record<string, string | undefined>
    for (const [key, value] of Object.entries(env)) {
      processEnv[key] ??= value
    }
  }
  const publicEnvDefines = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
      .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
  )

  // Vercel auto-populates `NEXT_PUBLIC_VERCEL_*` for Next.js projects but not
  // for other frameworks. Mirror that behaviour by re-exposing the unprefixed
  // system vars under their `NEXT_PUBLIC_VERCEL_*` names so call sites that
  // predate the TanStack migration keep working.
  const vercelPublicVars = [
    'VERCEL_ENV',
    'VERCEL_BRANCH_URL',
    // Sentry release (sentry.tanstack.ts): the SDK silently drops session
    // envelopes when the client has no release, so Release Health would send
    // nothing. The commit SHA is also what withSentryConfig resolves the Next
    // build's release to, keeping release names aligned across both builds.
    'VERCEL_GIT_COMMIT_SHA',
  ] as const
  for (const key of vercelPublicVars) {
    const value = env[key]
    if (value !== undefined) {
      publicEnvDefines[`process.env.NEXT_PUBLIC_${key}`] = JSON.stringify(value)
    }
  }

  // Sentry init (lib/sentry-client-options.ts, reached via router.tsx) reads
  // these at runtime in the browser. When a var is unset it gets no define
  // entry above, which would leave a literal `process.env.*` in the built
  // bundle — and an undeclared `process` throws in the browser. Inline
  // `undefined` as the fallback, mirroring how Next inlines unset
  // NEXT_PUBLIC_* vars.
  for (const key of [
    'NEXT_PUBLIC_SENTRY_DSN',
    'NEXT_PUBLIC_SENTRY_ENVIRONMENT',
    'NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA',
  ]) {
    publicEnvDefines[`process.env.${key}`] ??= 'undefined'
  }

  // Mirror Next's `basePath` via NEXT_PUBLIC_BASE_PATH. Unlike Next, TanStack
  // Start has no single knob — the prefix has to be declared in three places
  // (see BASE_PATH_REDIRECT_GUIDE.md):
  //   - Vite `base`               — bakes the prefix into asset URLs in the
  //                                  built bundle.
  //   - tanstackStart router.basepath — must be passed explicitly. If
  //                                  omitted, the plugin's internal
  //                                  `deriveRouterBasepath` derives a value
  //                                  from `publicBase` and strips both
  //                                  leading and trailing slashes
  //                                  (`/dashboard` → `dashboard`), which then
  //                                  surfaces in `useRouter().basePath`
  //                                  consumers as relative URLs (e.g.
  //                                  `${BASE_PATH}/img/...` becomes
  //                                  `dashboard/img/...` and the browser
  //                                  resolves it against the current path).
  //                                  See planning.js:14 in
  //                                  @tanstack/start-plugin-core.
  //   - createRouter({ basepath }) — runtime navigation prefix; configured
  //                                  in router.tsx off the same env var
  //                                  (inlined via `define` above).
  // Leaving the var empty keeps the app at `/` as today.
  const basePath = env.NEXT_PUBLIC_BASE_PATH || undefined

  // Skew protection — see the skewProtectionDpl comment above. Both are
  // build-time system env vars on Vercel; unset on local/self-hosted builds,
  // which disables the whole mechanism.
  const skewDeploymentId =
    env.VERCEL_SKEW_PROTECTION_ENABLED === '1' ? env.VERCEL_DEPLOYMENT_ID : undefined
  const dplSearch = skewDeploymentId ? `?dpl=${encodeURIComponent(skewDeploymentId)}` : ''

  // Substitutions that have to apply to *both* our app source (via Vite's
  // `define`) and any pre-bundled dependencies (via esbuild's optimizeDeps).
  // The two pipelines don't share config — Vite's `define` only touches
  // files going through Vite's transform, while optimizeDeps runs esbuild
  // on `node_modules` deps with its own separate `define`.
  //   - `global` → `globalThis`: makes Node-style libs (`randombytes` via
  //     `generate-password-browser`, etc.) work in the browser. Surfaces
  //     on /auth/hooks via `randombytes/browser.js:16`.
  //
  // NOTE: `define.amd` is deliberately NOT substituted here. The AMD
  // short-circuit is handled exclusively by the `umdAmdShortCircuit()`
  // transform above — a blanket `'define.amd': 'false'` define would also
  // rewrite the *read* in vendored bundles that install their own local
  // `define` shim (monaco-editor's `esm/vs/base/common/marked/marked.js`)
  // and break them — see the plugin's comment for the failure mode.
  const sharedDefines = {
    global: 'globalThis',
  }

  return {
    server: {
      port: 3000,
    },
    preview: {
      // The prerender step (@tanstack/start-plugin-core) boots `vite preview`
      // on an ephemeral port and crawls the first resolved URL. With the
      // default host (`localhost`) the server can bind the IPv6 loopback
      // while the crawler's fetch connects to 127.0.0.1 — split name
      // resolution that ECONNREFUSEDs the whole prerender inside docker
      // build containers. Pin both sides to IPv4 loopback.
      host: '127.0.0.1',
    },
    resolve: {
      tsconfigPaths: true,
      alias: [
        // `@sentry/nextjs`'s client entry drags in Next runtime internals
        // (`next/dist/shared/lib/constants`), whose module scope evaluates
        // `process?.features?.typescript` — optional chaining doesn't guard
        // an undeclared `process` in the browser, so every built chunk
        // containing it (e.g. table-editor) crashes at load with
        // "ReferenceError: process is not defined". Dev is unaffected
        // because the dev pipeline shims `process`. Point the bare import
        // at a shim that re-exports `@sentry/react` (same 10.x version —
        // it's what `@sentry/nextjs` wraps on the client) plus explicit
        // stand-ins for the Next-only APIs. Next build (`build:next`)
        // doesn't read this config and keeps the real package.
        {
          find: /^@sentry\/nextjs$/,
          replacement: path.resolve(rootDir, 'compat/sentry-nextjs.ts'),
        },
      ],
    },
    ...(basePath && { base: basePath }),
    // Skew protection part 1 (see skewProtectionDpl above): every asset /
    // public-file URL rendered into the bundle — CSS url()s, images, worker
    // URLs, `__vite__mapDeps` preload lists — gets the `?dpl=` pin. Returning
    // a string opts out of Vite's base handling, so the base path is joined
    // here. Left unset when the pin is off so Vite keeps its default
    // base-relative URL rendering.
    ...(dplSearch && {
      experimental: {
        renderBuiltUrl(filename: string) {
          return `${basePath ?? ''}/${filename}${dplSearch}`
        },
      },
    }),
    optimizeDeps: {
      // graphiql's Vite worker setup (swapped in for the webpack one by the
      // `graphiqlViteWorkers` plugin above) imports Monaco's workers with
      // Vite's `?worker` suffix. The dep optimizer can't load `?worker` ids
      // (UNLOADABLE_DEPENDENCY: "No such file or directory" for
      // `json.worker.js?worker` etc.), so keep the whole chain out of
      // pre-bundling; the modules then go through the normal transform
      // pipeline where Vite's built-in worker plugin turns each `?worker`
      // import into a spawnable Worker constructor.
      exclude: [
        'graphiql/setup-workers/webpack',
        'graphiql/setup-workers/vite',
        '@graphiql/react/setup-workers/vite',
      ],
    },
    define: {
      ...publicEnvDefines,
      ...sharedDefines,
    },
    // Circular-dep workaround: pin shared library code into dedicated
    // chunks so per-component chunks don't import from a chunk that
    // (transitively) imports them back.
    //
    //   `class-variance-authority` — TreeView gets split into its own
    //   chunk that imports `cva` from the `ui` chunk while `ui` imports
    //   TreeView back. Leaves `cva` undefined at TreeView's top-level
    //   `cva(...)` call during SSR prerender.
    //
    //   `lucide-react` — each icon (e.g. `FolderOpen`) gets a per-icon
    //   chunk that imports `createLucideIcon` from the `ui` chunk; the
    //   `ui` chunk in turn re-exports icons from `lucide-react`. The
    //   circular leaves `createLucideIcon` undefined when the icon
    //   chunk's top-level `createLucideIcon('FolderOpen', …)` runs —
    //   surfaces in the browser as "TypeError: e is not a function" at
    //   `folder-open-<hash>.js`.
    //
    //   `react` / `react-dom` — pinning lucide-react alone caused
    //   Rolldown to suck React into the lucide-react chunk (lucide
    //   depends on React, no explicit pin further up the graph). That
    //   shifted live-bindings across the rest of the chunk graph and
    //   broke unrelated chunks (e.g. `Alert-<hash>.js` started crashing
    //   with `c is not a function` because its `styleHandler` import
    //   came in through the now-too-large `lucide-react` chunk). Pin
    //   React explicitly so it stays a leaf vendor chunk.
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/class-variance-authority/')) {
              return 'class-variance-authority'
            }
            // Pin React / React-DOM (and their JSX runtimes + scheduler)
            // before lucide-react, so downstream chunks consume React
            // from one place. Rolldown can still inline React into
            // adjacent chunks for CJS interop, but the explicit pin
            // anchors the canonical copy here.
            if (
              /node_modules\/(react|react-dom|scheduler)(\/|$)/.test(id) ||
              /node_modules\/react\/jsx-(runtime|dev-runtime)/.test(id)
            ) {
              return 'react-vendor'
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'lucide-react'
            }
            return undefined
          },
        },
      },
    },
    css: {
      // Disable PostCSS auto-discovery. Studio's postcss.config.cjs is kept
      // for the Next build (`build:next`) and uses `@tailwindcss/postcss`,
      // but under Vite we let `@tailwindcss/vite` (added below) handle
      // Tailwind v4 directives directly. Running both plugins on the same
      // CSS would double-process Tailwind output.
      postcss: { plugins: [] },
    },
    ssr: {
      // `lodash` must stay inlined so its ids flow through the plugin
      // pipeline, where ssrLodashEs (above) rewrites them to lodash-es.
      // Externalized bare ids skip user plugins in the dev module runner, so
      // dropping this entry resurfaces Node's CJS named-export failure
      // ("Named export 'debounce' not found") on every `from 'lodash'` import.
      // `next/*` must be bundled so our nextCompat shim wins — otherwise Vite's
      // SSR externalizer leaves `next/router` as a runtime package import and
      // Node resolves it to Next's real module.
      // `tslib`'s Node ESM entry (`modules/index.js`) destructures from a
      // default-imported CJS wrapper (`tslib.js`). When consumers like
      // `@ai-sdk/amazon-bedrock` / `configcat-common` `import … from "tslib"`
      // and that ESM-wrapper gets picked, Rolldown botches the flattened UMD
      // body — "__extends is not a function" at SSR module evaluation time.
      // Inlining `tslib` lets the bundler reach the pure ESM entry directly.
      // `react-use` ships a CJS entry that Vite's SSR externalizer emits as
      // `import pkg from 'react-use'` + destructure. Works locally but
      // Vercel's Node resolves it differently and fails at module instantiate
      // (`ModuleJob._instantiate`). Inlining sidesteps the interop entirely.
      // `awesome-debounce-promise`'s CJS entry only emits
      // `exports.default = fn` (no `module.exports = fn`, no `__esModule`
      // flag). Node's CJS→ESM bridge therefore makes the default import the
      // entire exports object `{ default: fn }`, and call sites like
      // `AwesomeDebouncePromise(fn, 500)` crash with "is not a function" at
      // SSR module evaluation. Surfaces on routes that load the table grid.
      // `@sentry/nextjs` deliberately has no entry here: the resolve.alias
      // above rewrites it to the `@sentry/react`-backed shim before SSR
      // resolution ever sees the id, and `@sentry/react` ships real ESM
      // ("import" condition → build/esm), so plain externalization works.
      noExternal: ['lodash', /^next(\/|$)/, 'tslib', 'react-use', 'awesome-debounce-promise'],
    },
    plugins: [
      nextCompat(),
      rawTextLoader(),
      graphiqlViteWorkers(),
      ssrStubGraphiql(),
      ssrLodashEs(),
      umdAmdShortCircuit(),
      assertNoChunkCycles(),
      devtools(),
      tailwindcss(),
      tanstackStart({
        srcDirectory: './',
        spa: {
          enabled: true,
        },
        // Set `configuredBasepath` so `deriveRouterBasepath` short-circuits
        // its slash-stripping branch. See the basePath comment above.
        ...(basePath && { router: { basepath: basePath } }),
      }),
      viteReact(),
      // Skew protection parts 2 + 3. Registered after tanstackStart() so the
      // shell-patching buildApp hook runs after TanStack's prerender — see
      // the skewProtectionDpl comment.
      ...(dplSearch
        ? [skewProtectionDpl({ dplSearch, assetsUrlPrefix: `${basePath ?? ''}/assets/` })]
        : []),
      // Sentry's TanStack Start plugin(s) MUST be last so source maps reflect
      // every prior transform. `sentryTanstackStart` returns an ARRAY of
      // plugins (route patterns, source-map upload, middleware auto-wrap), so
      // it's spread. Source-map UPLOAD is skipped gracefully without
      // SENTRY_AUTH_TOKEN (and under SKIP_ASSET_UPLOAD). We disable the
      // middleware auto-wrap because start.ts wires the Sentry global
      // middlewares explicitly.
      ...sentryTanstackStart({
        org: process.env.SENTRY_ORG ?? 'supabase',
        project: process.env.SENTRY_PROJECT ?? 'supabase-studio-tanstack',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        autoInstrumentMiddleware: false,
        sourcemaps:
          process.env.SKIP_ASSET_UPLOAD === '1' || !process.env.SENTRY_AUTH_TOKEN
            ? { disable: true }
            : undefined,
      }),
    ],
  }
})
