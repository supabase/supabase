import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const artifactDir = path.resolve(rootDir, '..', 'coverage', 'acceptance')

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    globals: true,
    hookTimeout: 60_000,
    include: ['acceptance/specs/**/*.test.ts'],
    outputFile: process.env.CI
      ? {
          json: path.join(artifactDir, 'results.json'),
          junit: path.join(artifactDir, 'junit.xml'),
        }
      : undefined,
    reporters: process.env.CI ? ['default', 'junit', 'json'] : ['default'],
    testTimeout: 60_000,
  },
})
