// @ts-check
import { createRequire } from 'node:module'
import path from 'node:path'
import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import { BASE_PATH } from './src/lib/constants.ts'
import rehypeAdmonitions from './src/lib/mdx/rehype-admonitions.js'
import { sharedCodeBlock } from './src/lib/mdx/shiki-code-block.ts'
import { codeBlockTheme } from 'ui-patterns/CodeBlock/CodeBlock.theme'

// Absolute dir of lodash-es, for the lodash alias below (same fix
// apps/studio/vite.config.ts uses). `packages/ui`'s clipboard util does
// `import { noop } from 'lodash'` — under Vite's dev-mode SSR module runner,
// that CJS import evaluates as pure ESM (no module/exports/require), so the
// named import binds to undefined. lodash-es is real ESM and the same
// version, so the alias fixes the import without changes to the shared `ui`
// package. The client build also uses the alias, so the code block controls
// island includes only the lodash code that it uses.
const lodashEsDir = path.dirname(createRequire(import.meta.url).resolve('lodash-es/package.json'))

// Not typed as `import('vite').Plugin` — kb's own `vite` (from the pnpm
// catalog) and Astro's internal vite dependency resolve to distinct type
// instances, and comparing them blows TS's structural-comparison stack depth.
const lodashEs = {
  name: 'kb-lodash-es',
  enforce: 'pre',
  /**
   * @param {string} source
   */
  resolveId(source) {
    if (source === 'lodash') return path.join(lodashEsDir, 'lodash.js')
    const subpath = source.match(/^lodash\/(.+?)(\.js)?$/)
    if (subpath) return path.join(lodashEsDir, `${subpath[1]}.js`)
  },
}

// https://astro.build/config
export default defineConfig({
  site: 'https://supabase.com',
  base: BASE_PATH,
  trailingSlash: 'never',
  integrations: [
    react(), // rehype-admonitions is a custom rehype plugin and Astro's default pipeline is
    // satteri, so .mdx gets its own unified processor. Plain .md stays on satteri.
    mdx({
      processor: unified({
        rehypePlugins: [rehypeAdmonitions],
      }),
    }),
    sitemap(),
  ],
  vite: {
    ssr: {
      noExternal: ['lodash'],
    },
    plugins: [tailwindcss(), lodashEs],
    logLevel: 'error',
  },
  markdown: {
    shikiConfig: {
      theme: codeBlockTheme,
      transformers: [sharedCodeBlock],
    },
  },
})
