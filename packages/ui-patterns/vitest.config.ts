import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    reporters: ['default', 'json'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})
