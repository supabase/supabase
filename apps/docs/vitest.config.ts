import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Exclude examples from test discovery (does not affect tsconfig scanning)
    exclude: ['examples/**/*', '**/node_modules/**'],
    setupFiles: ['vitest.setup.ts'],
    globalSetup: ['vitest.globalSetup.ts'],
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
