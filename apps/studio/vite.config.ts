/* eslint-disable no-restricted-exports */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const compatRoot = path.resolve(rootDir, 'compat/next')

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
  // the UMD AMD-detection check. Replaces the whole expression with
  // `false` so dead-code elimination drops the AMD branch.
  const AMD_CHECK_PATTERNS = [
    /typeof\s+define\s*===?\s*['"]function['"]\s*&&\s*define\.amd/g,
    /['"]function['"]\s*===?\s*typeof\s+define\s*&&\s*define\.amd/g,
  ]

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
        next = next.replace(pattern, 'false')
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

export default defineConfig(({ mode }) => {
  // Inline NEXT_PUBLIC_* env vars at build time so `process.env.NEXT_PUBLIC_*`
  // works in the browser bundle (mirrors Next.js behaviour). loadEnv reads the
  // standard .env file hierarchy and merges with process.env.
  const env = loadEnv(mode, rootDir, '')
  const publicEnvDefines = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
      .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
  )

  // Vercel auto-populates `NEXT_PUBLIC_VERCEL_*` for Next.js projects but not
  // for other frameworks. Mirror that behaviour by re-exposing the unprefixed
  // system vars under their `NEXT_PUBLIC_VERCEL_*` names so call sites that
  // predate the TanStack migration keep working.
  const vercelPublicVars = ['VERCEL_ENV', 'VERCEL_BRANCH_URL'] as const
  for (const key of vercelPublicVars) {
    const value = env[key]
    if (value !== undefined) {
      publicEnvDefines[`process.env.NEXT_PUBLIC_${key}`] = JSON.stringify(value)
    }
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

  // Substitutions that have to apply to *both* our app source (via Vite's
  // `define`) and any pre-bundled dependencies (via esbuild's optimizeDeps).
  // The two pipelines don't share config — Vite's `define` only touches
  // files going through Vite's transform, while optimizeDeps runs esbuild
  // on `node_modules` deps with its own separate `define`.
  //   - `global` → `globalThis`: makes Node-style libs (`randombytes` via
  //     `generate-password-browser`, etc.) work in the browser. Surfaces
  //     on /auth/hooks via `randombytes/browser.js:16`.
  //   - `define.amd` → `false`: short-circuits the AMD branch in UMD
  //     wrappers (papaparse, others). Monaco's CDN loader installs an
  //     AMD-style `window.define` at runtime; without this substitution,
  //     UMD libs evaluate after Monaco has loaded and call an anonymous
  //     `define([], t)` that Monaco's queue rejects with "Can only have
  //     one anonymous define call per script file". Surfaces concretely
  //     on /functions/[slug] (papaparse pulled in by invocations).
  //     Monaco's loader.js itself runs from a CDN script tag (not in our
  //     bundle / not pre-bundled), so its own `define.amd = true` write
  //     isn't affected by the substitution.
  const sharedDefines = {
    global: 'globalThis',
    'define.amd': 'false',
  }

  return {
    server: {
      port: 3000,
    },
    resolve: {
      tsconfigPaths: true,
    },
    ...(basePath && { base: basePath }),
    define: {
      ...publicEnvDefines,
      ...sharedDefines,
    },
    // Circular-dep workaround: pin `class-variance-authority` to its own
    // chunk. Without this, Rolldown splits `TreeView` into a separate
    // chunk that imports `cva` from the `ui` chunk while the `ui` chunk
    // imports `TreeView` back — a circular dep in the bundle output (not
    // in source) that leaves `cva` undefined when TreeView's top-level
    // `cva(...)` initializer runs at SSR prerender time. See
    // CIRCULAR_IMPORTS.md (entry #1) — slated to be lifted into a
    // separate PR.
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) =>
            id.includes('node_modules/class-variance-authority/')
              ? 'class-variance-authority'
              : undefined,
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
      // `lodash` is CJS; its named-export interop fails in Node ESM unless bundled.
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
      noExternal: ['lodash', /^next(\/|$)/, 'tslib', 'react-use'],
    },
    plugins: [
      nextCompat(),
      ssrStubGraphiql(),
      umdAmdShortCircuit(),
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
    ],
  }
})
