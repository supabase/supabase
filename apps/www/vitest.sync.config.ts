import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

/**
 * Runs only PartnerIntakeForm.sync.test.ts, which the default vitest.config.ts
 * deliberately excludes from `pnpm test` — see the comment there. Used by
 * `pnpm run test:partner-form-sync` and by the path-filtered
 * www-partner-form-sync-check.yml workflow, not by the regular www-tests.yml
 * suite that gates every apps/www PR.
 */
export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ['.'],
    }),
  ],
  test: {
    include: ['components/Partners/PartnerIntakeForm.sync.test.ts'],
  },
})
