import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * `vite` serves the fixture gallery (surfaces/*.html). `scripts/build.mjs`
 * runs one production build per surface (SURFACE) into a single script and
 * stylesheet: the MCP server renders the document and either links or inlines
 * them, so nothing may be split into further chunks or files.
 */
const surface = process.env.SURFACE

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // ui-patterns/Chart imports next/link for an optional footer link.
      'next/link': here('./src/shims/next-link.tsx'),
    },
  },
  define: {
    // Some ui internals read process.env.NODE_ENV directly.
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  build: surface
    ? {
        target: 'es2022',
        outDir: process.env.SURFACE_OUT_DIR,
        emptyOutDir: true,
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        cssCodeSplit: false,
        modulePreload: false,
        chunkSizeWarningLimit: 4096,
        rollupOptions: {
          input: here(`./src/entries/${surface}.tsx`),
          output: {
            codeSplitting: false,
            entryFileNames: `${surface}.js`,
            assetFileNames: (asset) =>
              asset.names?.some((name) => name.endsWith('.css'))
                ? `${surface}.css`
                : `assets/[name]-[hash][extname]`,
          },
        },
      }
    : undefined,
})
