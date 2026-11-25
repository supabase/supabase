import { defineConfig } from '@playwright/test'

const IS_CI = !!process.env.CI

// One worker is enough for a typical change. Past the accessibility scan limit the
// link check gets more, because it is the one that runs on every page.
const PAGE_COUNT = (process.env.DOCS_E2E_PAGE_PATHS ?? '').split(/[\n,]/).filter((path) => path.trim())
  .length
const LINK_WORKERS = PAGE_COUNT > 20 ? 4 : 1

export default defineConfig({
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  // Total across both projects.
  workers: LINK_WORKERS + 1,
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
  projects: [
    {
      name: 'Links',
      testDir: './features',
      testMatch: /.*\.spec\.ts/,
      grepInvert: /@a11y/,
      workers: LINK_WORKERS,
      use: {
        browserName: 'chromium',
      },
    },
    {
      // axe scans are heavy, so they stay on one worker.
      name: 'Accessibility',
      testDir: './features',
      testMatch: /.*\.spec\.ts/,
      grep: /@a11y/,
      workers: 1,
      use: {
        browserName: 'chromium',
      },
    },
  ],
  reporter: IS_CI
    ? [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: './playwright-report' }],
        ['json', { outputFile: './test-results/test-results.json' }],
      ],
  outputDir: './test-results',
})
