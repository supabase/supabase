import { configDefaults, defineConfig } from 'vitest/config'

import sentryConfig from './vitest.sentry.config.mjs'

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: 'unit',
          exclude: [...configDefaults.exclude, '.next/*', 'lib/sentry-capture.test.tsx'],
        },
      },
      sentryConfig,
    ],
  },
})
