import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

const dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      projects: ['.'],
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(dirname, './tests/vitestSetup.ts')],
    exclude: [...configDefaults.exclude, '.next/*'],
    reporters: [['default']],
    coverage: {
      reporter: ['text', 'text-summary', 'lcov'],
      include: [
        'lib/marketplace/**/*.ts',
        'app/protected/actions.ts',
        'lib/supabase/proxy-rules.ts',
      ],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/tests/**'],
      thresholds: {
        lines: 40,
        statements: 40,
        branches: 35,
        functions: 40,
      },
    },
  },
})
