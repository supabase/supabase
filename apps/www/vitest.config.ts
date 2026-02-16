import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ['.'],
    }),
  ],
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, '.next/*'],
  },
})
