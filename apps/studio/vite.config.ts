import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import circleDependency from 'vite-plugin-circular-dependency'
import { cjsInterop } from 'vite-plugin-cjs-interop'

const NEXT_ENV_PREFIX = 'NEXT_PUBLIC_'
const VITE_ENV_PREFIX = 'VITE_'

export default defineConfig(({ mode }) => {
  const envs = Object.fromEntries(
    Object.entries(loadEnv(mode, process.cwd(), [NEXT_ENV_PREFIX, VITE_ENV_PREFIX])).map(
      ([key, value]) => {
        if (key.startsWith(VITE_ENV_PREFIX)) {
          return [key.replace(VITE_ENV_PREFIX, NEXT_ENV_PREFIX), value]
        }
        return [key, value]
      }
    )
  )

  return {
    define: {
      'process.env': envs,
    },
    resolve: {
      alias: {
        os: 'rollup-plugin-node-polyfills/polyfills/os',

        components: path.resolve(__dirname, 'components'),
        data: path.resolve(__dirname, 'data'),
        hooks: path.resolve(__dirname, 'hooks'),
        lib: path.resolve(__dirname, 'lib'),
        localStores: path.resolve(__dirname, 'localStores'),
        pages: path.resolve(__dirname, 'pages'),
        state: path.resolve(__dirname, 'state'),
        stores: path.resolve(__dirname, 'stores'),
        styles: path.resolve(__dirname, 'styles'),
        types: path.resolve(__dirname, 'types'),
        '@ui': path.resolve(__dirname, './../../packages/ui/src'),
        '~ui': 'ui',

        'next/link': path.resolve(__dirname, 'lib', 'next-compat', 'link.tsx'),
        'next/router': path.resolve(__dirname, 'lib', 'next-compat', 'router.ts'),
        'next/compat/router': path.resolve(__dirname, 'lib', 'next-compat', 'router.ts'),
        'next/navigation': path.resolve(__dirname, 'lib', 'next-compat', 'navigation.ts'),
        'next/head': path.resolve(__dirname, 'lib', 'next-compat', 'head.ts'),
        'next/dynamic': path.resolve(__dirname, 'lib', 'next-compat', 'dynamic.ts'),
        'next/image': path.resolve(__dirname, 'lib', 'next-compat', 'image.ts'),
        'next/legacy/image': path.resolve(__dirname, 'lib', 'next-compat', 'image.ts'),
        '@sentry/nextjs': path.resolve(__dirname, 'lib', 'next-compat', 'sentry.ts'),
      },
    },
    envPrefix: NEXT_ENV_PREFIX,
    server: { port: 8082 },
    preview: { port: 8082 },
    base:
      process.env.NEXT_PUBLIC_BASE_PATH && process.env.NEXT_PUBLIC_BASE_PATH !== '/'
        ? `${process.env.NEXT_PUBLIC_BASE_PATH}/`
        : '/',
    plugins: [
      circleDependency(),
      cjsInterop({
        dependencies: [
          'react-use',
          'lodash',
          'awesome-debounce-promise',
          'p-queue',
          'react-copy-to-clipboard',
        ],
      }),
      TanStackRouterVite({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: './routes',
        generatedRouteTree: './routeTree.gen.ts',
      }),
      react(),
    ],
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
        plugins: [
          NodeGlobalsPolyfillPlugin({
            process: false,
            buffer: true,
          }) as any,
        ],
      },
    },
  }
})
