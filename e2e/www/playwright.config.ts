import { defineConfig } from '@playwright/test'

const IS_CI = !!process.env.CI

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  maxFailures: 3,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: 1,
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    headless: true,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]],
  outputDir: './test-results',
})
