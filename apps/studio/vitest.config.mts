import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'url'
import { resolve } from 'path'
import path from 'path'
import react from '@vitejs/plugin-react'

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
      '@ui': path.resolve(__dirname, './../../packages/ui/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom', // TODO(kamil): This should be set per test via header in .tsx files only
    include: [
      resolve(dirname, './tests/**/*.test.{ts,tsx}'),
      resolve(dirname, './components/**/*.test.{ts,tsx}'),
    ],
    restoreMocks: true,
    setupFiles: [
      resolve(dirname, './tests/vitestSetup.ts'),
      resolve(dirname, './tests/setup/testing-library-matchers.js'),
      resolve(dirname, './tests/setup/polyfills.js'),
      resolve(dirname, './tests/setup/radix.js'),
    ],
  },
})
