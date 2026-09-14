import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    reporters: [['default']],
    coverage: {
      reporter: ['lcov'],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    },
  },
})
