import { defineConfig } from '@playwright/test'

import { isSupabaseHost } from '../shared/hosts.ts'

const IS_CI = !!process.env.CI

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

const BYPASS_SECRET = isSupabaseHost(BASE_URL)
  ? process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  : undefined

// `maxFailures` and `reporter` are whole-run options, so the selected project has
// to be read from argv. Every entry point passes `--project=`.
const PROJECT = process.argv.find((arg) => arg.startsWith('--project='))?.slice('--project='.length)

const IS_GLOBAL_ELEMENTS = PROJECT === 'global-elements'

const REPORT_DIR = IS_GLOBAL_ELEMENTS
  ? './playwright-report-global-elements'
  : './playwright-report'

export default defineConfig({
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  // One bad page must not hide the rest of the chrome.
  maxFailures: IS_GLOBAL_ELEMENTS ? 0 : 3,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // Parallel navigations time out against production once the page suite resolves
  // hundreds of pages. The global-element suite is a fixed 17 tests.
  workers: IS_GLOBAL_ELEMENTS ? 4 : 1,
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    headless: true,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    extraHTTPHeaders: BYPASS_SECRET
      ? {
          'x-vercel-protection-bypass': BYPASS_SECRET,
          'x-vercel-set-bypass-cookie': 'true',
        }
      : undefined,
  },
  projects: [
    {
      name: 'pages',
      testDir: './features',
      testMatch: /.*\.spec\.ts/,
      outputDir: './test-results',
    },
    {
      name: 'global-elements',
      testDir: './global-elements',
      testMatch: /.*\.spec\.ts/,
      timeout: 120_000,
      fullyParallel: true,
      outputDir: './test-results-global-elements',
    },
  ],
  reporter: [['list'], ['html', { open: 'never', outputFolder: REPORT_DIR }]],
  outputDir: './test-results',
})
