import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    exclude: ['examples/**/*', '**/node_modules/**'],
  },
  plugins: [tsconfigPaths({ root: import.meta.dirname })],
})
