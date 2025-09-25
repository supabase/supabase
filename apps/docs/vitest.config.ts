import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// eslint-disable-next-line no-restricted-exports
export default defineConfig({
  test: {
    // Exclude examples from test discovery (does not affect tsconfig scanning)
    exclude: ['examples/**/*', '**/node_modules/**'],
    setupFiles: ['vitest.setup.ts'],
  },
  // Restrict tsconfig-paths to only use this app's tsconfig
  plugins: [
    tsconfigPaths({
      root: import.meta.dirname,
      // Prevent scanning tsconfig files in subfolders like examples/**
      projects: ['tsconfig.json'],
    }),
  ],
})
