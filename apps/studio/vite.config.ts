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
  //   - Vite `base`      — bakes the prefix into asset URLs in the built bundle
  //   - Router `basepath` — makes client-side navigation match the prefix
  // The router layer is set in router.tsx off the same env var (inlined via
  // `define` above). Leaving the var empty keeps the app at `/` as today.
  const basePath = env.NEXT_PUBLIC_BASE_PATH || undefined

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
      // Node-style libs (e.g. `randombytes` via `generate-password-browser`)
      // reference `global`, which exists in Node but not in browsers. Webpack
      // auto-polyfilled this; Vite doesn't. Map the identifier to `globalThis`
      // (which is the same object in Node and the browser) at build time so
      // these libs work without per-import patches. Surfaces concretely on
      // /auth/hooks via `randombytes/browser.js:16`.
      global: 'globalThis',
      // Force papaparse's UMD wrapper down its non-AMD branch. Monaco's
      // CDN loader installs an AMD-style `window.define` at runtime; when
      // a chunk containing papaparse evaluates after Monaco has loaded,
      // papaparse's `typeof define === "function" && define.amd` check
      // hits the AMD path and calls an anonymous `define([], t)` that
      // Monaco's loader queue rejects with "Can only have one anonymous
      // define call per script file". Surfaces in prod builds when
      // navigating from /projects into a project (the chunk-evaluation
      // order lets Monaco register first); direct loads happen to load
      // papaparse first and dodge the conflict.
      //
      // Substituting the bare identifier `define.amd` to `false` at
      // build time short-circuits the AMD branch in our bundle. Monaco's
      // loader.js is loaded as a runtime script (not in our bundle) so
      // its own `define.amd = true` write isn't affected.
      'define.amd': 'false',
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
      devtools(),
      tailwindcss(),
      tanstackStart({
        srcDirectory: './',
        spa: {
          enabled: true,
        },
      }),
      viteReact(),
    ],
  }
})
