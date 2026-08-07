import { defineConfig } from '@playwright/test'

const IS_CI = !!process.env.CI

export default defineConfig({
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  maxFailures: 3,
  expect: { timeout: 15_000 },
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    browserName: 'chromium',
    headless: true,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          'x-vercel-set-bypass-cookie': 'true',
        }
      : undefined,
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]],
  outputDir: './test-results',
})
