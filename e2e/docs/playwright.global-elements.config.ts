import { defineConfig } from '@playwright/test'

const IS_CI = !!process.env.CI

// A separate config rather than a project in playwright.config.ts, so
// `pnpm e2e:docs` on a content pull request never picks these up.
export default defineConfig({
  testDir: './global-elements',
  testMatch: /.*\.spec\.ts/,
  timeout: 120_000,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  maxFailures: 3,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    browserName: 'chromium',
    headless: true,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          'x-vercel-set-bypass-cookie': 'true',
        }
      : undefined,
  },
  reporter: IS_CI
    ? [['list'], ['html', { open: 'never', outputFolder: './playwright-report-global-elements' }]]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: './playwright-report-global-elements' }],
        ['json', { outputFile: './test-results/global-elements-results.json' }],
      ],
  outputDir: './test-results',
})
