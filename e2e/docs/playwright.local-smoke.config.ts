import { defineConfig } from '@playwright/test'

const IS_CI = !!process.env.CI

const WEB_SERVER_PORT = Number(process.env.WEB_SERVER_PORT) || 3001

export default defineConfig({
  testDir: './local-smoke',
  testMatch: /.*\.spec\.ts/,
  timeout: 90_000,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  maxFailures: 3,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://localhost:${WEB_SERVER_PORT}`,
    browserName: 'chromium',
    headless: true,
    navigationTimeout: 60_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  reporter: IS_CI
    ? [['list'], ['html', { open: 'never', outputFolder: './playwright-report-local-smoke' }]]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: './playwright-report-local-smoke' }],
        ['json', { outputFile: './test-results/local-smoke-results.json' }],
      ],
  outputDir: './test-results',
  webServer: {
    command: 'pnpm --workspace-root run dev:docs',
    port: WEB_SERVER_PORT,
    timeout: 4 * 60 * 1000,
    // Never reuse a running server: it may hold real credentials from .env.local.
    reuseExistingServer: false,
    env: {
      DOCS_GITHUB_APP_PRIVATE_KEY: '',
      DOCS_GITHUB_APP_ID: '',
      DOCS_GITHUB_APP_INSTALLATION_ID: '',
      SUPABASE_SECRET_KEY: '',
      OPENAI_API_KEY: '',
      DOCS_REVALIDATION_KEYS: '',
      DOCS_REVALIDATION_OVERRIDE_KEYS: '',
    },
  },
})
