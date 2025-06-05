import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['examples/**/*', '**/node_modules/**'],
    setupFiles: ['vitest.setup.ts'],
  },
  plugins: [tsconfigPaths({ root: import.meta.dirname })],
})
