import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// Some tools like Vitest VSCode extensions, have trouble with resolving relative paths,
// as they use the directory of the test file as `cwd`, which makes them believe that
// `setupFiles` live next to the test file itself. This forces them to always resolve correctly.
const dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      projects: ['.'],
    }),
  ],
  resolve: {
    alias: {
      '@ui': resolve(__dirname, './../../packages/ui/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom', // TODO(kamil): This should be set per test via header in .tsx files only
    setupFiles: [
      resolve(dirname, './tests/vitestSetup.ts'),
      resolve(dirname, './tests/setup/polyfills.js'),
      resolve(dirname, './tests/setup/radix.js'),
    ],
    reporters: [['default']],
    coverage: {
      reporter: ['lcov'],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      include: ['lib/**/*.ts'],
    },
  },
})
