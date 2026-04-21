/* eslint-disable no-restricted-exports */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
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
// `document` at module-evaluation time. During Nitro's prerender (which boots
// a real Node server and fetches `/`), that hard-crashes with
// "document is not defined" as soon as the graphiql chunk gets loaded.
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
  //   - Nitro `baseURL`  — mounts the production server at that path
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
    define: publicEnvDefines,
    ssr: {
      // `lodash` is CJS; its named-export interop fails in Node ESM unless bundled.
      // `next/*` must be bundled so our nextCompat shim wins — otherwise Vite's
      // SSR externalizer leaves `next/router` as a runtime package import and
      // Node resolves it to Next's real module.
      // `tslib` gets inlined at build time so the external-trace copy pass
      // doesn't have to ship a package whose `exports` field points at
      // `modules/index.js` — a CJS-interop wrapper Rolldown doesn't bundle
      // cleanly, and which wouldn't be present in the copied output anyway
      // once `exportConditions` redirects Nitro to the pure-ESM entry.
      noExternal: ['lodash', /^next(\/|$)/, 'tslib'],
    },
    plugins: [
      nextCompat(),
      ssrStubGraphiql(),
      devtools(),
      tanstackStart({
        srcDirectory: './',
        spa: {
          enabled: true,
        },
      }),
      nitro({
        // `tslib`'s Node ESM entry (`modules/index.js`) destructures from a
        // default-imported CJS file (`tslib.js`). When Nitro's external-tracer
        // resolves packages like `@ai-sdk/amazon-bedrock` that `import … from
        // "tslib"`, it picks up that ESM-wrapper which Rolldown then botches
        // when flattening the UMD body — producing "__extends is not a
        // function" at SSR module evaluation time (configcat-common hits this
        // too). Preferring the `module` export condition makes the resolver
        // select the pure ESM `tslib.es6.mjs` directly, and forcing `tslib`
        // inline keeps its runtime resolution (which would still look for
        // `modules/index.js` via `package.json#exports`) out of the picture.
        exportConditions: ['module'],
        noExternals: ['tslib'],
        // See the `basePath` comment above — Nitro's own mount point needs the
        // same prefix as Vite/router. `routeRules` paths are matched AFTER
        // baseURL is stripped, so if we add redirects later they should be
        // written relative to the base.
        ...(basePath && { baseURL: basePath }),
      }),
      viteReact(),
    ],
  }
})
