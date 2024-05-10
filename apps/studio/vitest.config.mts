import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

// Some tools like Vitest VSCode extensions, have trouble with resolving relative paths,
// as they use the directory of the test file as `cwd`, which makes them believe that
// `setupFiles` live next to the test file itself. This forces them to always resolve correctly.
const dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: [resolve(dirname, './tests/**/*.test.js'), resolve(dirname, './tests/**/*.test.ts')],
    restoreMocks: true,
    // setupFiles: [
    //   resolve(dirname, './test/env.ts'),
    //   resolve(dirname, './test/mocks.ts'),
    //   resolve(dirname, './test/setup.ts'),
    // ],
  },
})
