import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ['.'],
    }),
  ],
  test: {
    exclude: [
      ...configDefaults.exclude,
      '.next/*',
      // Deliberately NOT part of the regular `pnpm test` run: this checks
      // PartnerIntakeForm against a live HubSpot snapshot, and a HubSpot-side
      // change (nothing to do with any given PR) shouldn't be able to fail
      // CI for unrelated apps/www work. It runs via its own dedicated
      // `test:partner-form-sync` script instead — see vitest.sync.config.ts
      // and .github/workflows/www-partner-form-sync-check.yml.
      'components/Partners/PartnerIntakeForm.sync.test.ts',
    ],
  },
})
