/* eslint-disable no-restricted-exports */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
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

  return {
    server: {
      port: 3000,
    },
    resolve: {
      tsconfigPaths: true,
    },
    define: publicEnvDefines,
    ssr: {
      // `lodash` is CJS; its named-export interop fails in Node ESM unless bundled.
      // `next/*` must be bundled so our nextCompat shim wins — otherwise Vite's
      // SSR externalizer leaves `next/router` as a runtime package import and
      // Node resolves it to Next's real module.
      noExternal: ['lodash', /^next(\/|$)/],
    },
    plugins: [
      nextCompat(),
      devtools(),
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
