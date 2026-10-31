import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // compile jsx for tests without nextjs
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    // Exclude examples from test discovery (does not affect tsconfig scanning)
    exclude: ['examples/**/*', '**/node_modules/**'],
    setupFiles: ['vitest.setup.ts'],
    globalSetup: ['vitest.globalSetup.ts'],
  },
})
