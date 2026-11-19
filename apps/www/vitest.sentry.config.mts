import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const require = createRequire(import.meta.url)

export default defineConfig({
  resolve: {
    alias: {
      '@sentry/nextjs': resolve(
        dirname(require.resolve('@sentry/nextjs/package.json')),
        'build/esm/index.client.js'
      ),
    },
  },
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    name: 'sentry-browser',
    environment: 'jsdom',
    server: { deps: { inline: [/@sentry/] } },
    include: ['lib/sentry-capture.test.tsx'],
    env: {
      NEXT_PUBLIC_IS_PLATFORM: 'true',
      NEXT_PUBLIC_SENTRY_DSN: 'https://public@sentry.test/1',
    },
  },
})
