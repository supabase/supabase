/* eslint-disable no-restricted-exports */
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, type PluginOption } from 'vite'

// Served at supabase.com/templates through a rewrite in apps/www, like apps/kb
// at /kb. Keep in sync with BASE_PATH in src/lib/base-path.ts.
const BASE_PATH = '/templates'

const plugins: PluginOption[] = [
  tailwindcss(),
  nitro({
    serverEntry: false,
    vercel: {
      config: {
        version: 3,
        // Pages and asset URLs live under BASE_PATH, but Nitro writes static
        // files to the root of the output. These routes sit above Nitro's
        // `handle: filesystem` and map prefixed static requests to the root
        // (apps/studio's vercel-spa-routes does the same for /dashboard).
        routes: [
          {
            src: `^${BASE_PATH}/(assets/.+)$`,
            dest: '/$1',
            headers: { 'cache-control': 'public, max-age=31536000, immutable' },
          },
          {
            src: `^${BASE_PATH}/(screenshots/.+|favicon\\.ico|supabase-(?:dark|light)\\.svg)$`,
            dest: '/$1',
          },
        ],
      },
    },
  }),
  tanstackStart({ router: { basepath: BASE_PATH } }),
  viteReact(),
]

export default defineConfig({
  base: `${BASE_PATH}/`,
  resolve: { tsconfigPaths: true },
  // `lodash` is CJS and its named exports fail Node's ESM interop during SSR,
  // so bundle it instead of externalizing it.
  ssr: { noExternal: ['lodash'] },
  plugins,
})
