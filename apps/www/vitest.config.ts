import { configDefaults, defineConfig } from 'vitest/config'

import sentryConfig from './vitest.sentry.config.mjs'

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: 'unit',
          include: [...configDefaults.include, '../../packages/common/sentry.test.ts'],
          exclude: [...configDefaults.exclude, '.next/*', 'lib/sentry-capture.test.tsx'],
        },
      },
      sentryConfig,
    ],
  },
})
