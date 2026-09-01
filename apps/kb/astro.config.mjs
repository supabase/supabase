// @ts-check
import { createRequire } from 'node:module'
import path from 'node:path'

import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// Absolute dir of lodash-es, for the SSR-only lodash alias below (same fix
// apps/studio/vite.config.ts uses). `packages/ui`'s clipboard util does
// `import { noop } from 'lodash'` — under Vite's dev-mode SSR module runner,
// that CJS import evaluates as pure ESM (no module/exports/require), so the
// named import binds to undefined. lodash-es is real ESM and the same
// version, so swapping it in for SSR only (client bundles are untouched)
// fixes it without touching the shared `ui` package.
const lodashEsDir = path.dirname(createRequire(import.meta.url).resolve('lodash-es/package.json'))

// Not typed as `import('vite').Plugin` — kb's own `vite` (from the pnpm
// catalog) and Astro's internal vite dependency resolve to distinct type
// instances, and comparing them blows TS's structural-comparison stack depth.
const ssrLodashEs = {
  name: 'kb-ssr-lodash-es',
  enforce: 'pre',
  /**
   * @param {string} source
   * @param {string | undefined} _importer
   * @param {{ ssr?: boolean } | undefined} options
   */
  resolveId(source, _importer, options) {
    if (!options?.ssr) return
    if (source === 'lodash') return path.join(lodashEsDir, 'lodash.js')
    const subpath = source.match(/^lodash\/(.+?)(\.js)?$/)
    if (subpath) return path.join(lodashEsDir, `${subpath[1]}.js`)
  },
}

// https://astro.build/config
export default defineConfig({
  base: '/kb',
  integrations: [react()],
  vite: {
    ssr: {
      noExternal: ['lodash'],
    },
    plugins: [tailwindcss(), ssrLodashEs],
  },
})
