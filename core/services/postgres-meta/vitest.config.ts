/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: { reporter: ['lcov'] },
    maxConcurrency: 1,
    // https://github.com/vitest-dev/vitest/issues/317#issuecomment-1542319622
    pool: 'forks',
  },
})
