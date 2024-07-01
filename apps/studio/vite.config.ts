import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { vitePlugin as remix } from '@remix-run/dev'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import circleDependency from 'vite-plugin-circular-dependency'
import { cjsInterop } from 'vite-plugin-cjs-interop'

const ENV_PREFIX = 'NEXT_PUBLIC_'

export default defineConfig(({ mode }) => {
  return {
    define: {
      'process.env': loadEnv(mode, process.cwd(), ENV_PREFIX),
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
        'next/legacy/image': path.resolve(__dirname, 'lib', 'next-compat', 'image.ts'),
        '@sentry/nextjs': path.resolve(__dirname, 'lib', 'next-compat', 'sentry.ts'),
      },
    },
    envPrefix: ENV_PREFIX,
    server: { port: 8082 },
    preview: { port: 8082 },
    base:
      process.env.NEXT_PUBLIC_BASE_PATH && process.env.NEXT_PUBLIC_BASE_PATH !== '/'
        ? `${process.env.NEXT_PUBLIC_BASE_PATH}/`
        : '/',
    plugins: [
      circleDependency(),
      cjsInterop({
        dependencies: ['react-use', 'lodash', 'awesome-debounce-promise', 'p-queue'],
      }),
      remix({
        basename: process.env.NEXT_PUBLIC_BASE_PATH ?? '/',
        ssr: false,
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
        },
      }),
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
