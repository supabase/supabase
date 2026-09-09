import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  oxc: {
    jsx: 'automatic',
  },
  plugins: [
    tsconfigPaths({
      projects: ['.'],
    }),
  ],
  test: {
    exclude: [...configDefaults.exclude, '.next/*'],
  },
})
