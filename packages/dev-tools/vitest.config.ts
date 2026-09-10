import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'next/image': path.resolve(__dirname, './__mocks__/next-image.tsx'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    reporters: [['default']],
    coverage: {
      reporter: ['lcov'],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      include: ['**/*.ts', '**/*.tsx'],
    },
  },
})
