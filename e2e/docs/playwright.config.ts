import { defineConfig } from '@playwright/test'

import { isSupabaseHost } from '../shared/hosts.ts'

const IS_CI = !!process.env.CI

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

const BYPASS_SECRET = isSupabaseHost(BASE_URL)
  ? process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  : undefined

// maxFailures, the worker pool, and reporters are config-level only in Playwright,
// so the selected project has to be read from argv.
const IS_GLOBAL_ELEMENTS = process.argv.some(
  (arg) => arg === '--project=global-elements' || arg === 'global-elements'
)

const REPORT_FOLDER = IS_GLOBAL_ELEMENTS
  ? './playwright-report-global-elements'
  : './playwright-report'

const JSON_REPORT = IS_GLOBAL_ELEMENTS
  ? './test-results/global-elements-results.json'
  : './test-results/test-results.json'

export default defineConfig({
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  // An early stop hides findings from the remaining surfaces.
  maxFailures: IS_GLOBAL_ELEMENTS ? 0 : 3,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: IS_GLOBAL_ELEMENTS ? (IS_CI ? 2 : undefined) : 1,
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    headless: true,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
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
      use: {
        browserName: 'chromium',
      },
    },
    {
      name: 'global-elements',
      testDir: './global-elements',
      testMatch: /.*\.spec\.ts/,
      timeout: 120_000,
      fullyParallel: true,
      workers: IS_CI ? 2 : undefined,
      use: {
        browserName: 'chromium',
      },
    },
  ],
  reporter: IS_CI
    ? [['list'], ['html', { open: 'never', outputFolder: REPORT_FOLDER }]]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: REPORT_FOLDER }],
        ['json', { outputFile: JSON_REPORT }],
      ],
  outputDir: './test-results',
})
