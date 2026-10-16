import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    reporters: [['default']],
    coverage: {
      reporter: ['lcov'],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      include: ['**/*.ts', '**/*.tsx'],
    },
  },
})
