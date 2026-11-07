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
          exclude: [
            ...configDefaults.exclude,
            '.next/*',
            'lib/sentry-capture.test.tsx',
            // Deliberately NOT part of the regular `pnpm test` run: this checks
            // PartnerIntakeForm against a live HubSpot snapshot, and a HubSpot-side
            // change (nothing to do with any given PR) shouldn't be able to fail
            // CI for unrelated apps/www work. It runs via its own dedicated
            // `test:partner-form-sync` script instead — see vitest.sync.config.ts
            // and .github/workflows/www-partner-form-sync-check.yml.
            'components/Partners/PartnerIntakeForm.sync.test.ts',
          ],
        },
      },
      sentryConfig,
    ],
  },
})
