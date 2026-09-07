import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['supabase/tests/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false,
  },
})
