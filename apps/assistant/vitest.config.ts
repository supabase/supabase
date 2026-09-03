import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['supabase/workers/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': new URL('./supabase/workers/api/src', import.meta.url).pathname,
    },
  },
})
