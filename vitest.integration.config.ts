import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import IntegrationSequencer from './vitest.integration.sequencer'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@internal': path.resolve(rootDir, 'src/internal'),
      '@storage': path.resolve(rootDir, 'src/storage'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['lcovonly', 'text-summary'],
    },
    environment: 'node',
    fileParallelism: false,
    globals: true,
    hookTimeout: 30_000,
    include: ['src/test/**/*.test.ts'],
    sequence: {
      sequencer: IntegrationSequencer,
    },
    setupFiles: ['src/test/vitest-setup.ts'],
    testTimeout: 10_000,
  },
})
