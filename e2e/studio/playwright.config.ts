import { defineConfig } from '@playwright/test'
import { env, STORAGE_STATE_PATH } from './env.config'

const IS_CI = !!process.env.CI

const CI_TIMEOUT = 60_000
const DEV_TIMEOUT = 300_1000

export default defineConfig({
  timeout: IS_CI ? CI_TIMEOUT : DEV_TIMEOUT,
  globalSetup: './global.setup.ts',
  forbidOnly: IS_CI,
  retries: IS_CI ? 3 : 0,
  maxFailures: IS_CI ? 1 : undefined,
  use: {
    baseURL: env.STUDIO_URL,
    screenshot: 'off',
    video: IS_CI ? 'retain-on-failure' : 'on',
    headless: true,
    trace: IS_CI ? 'retain-on-failure' : 'on',
  },
  projects: [
    {
      name: 'Features',
      testDir: './features',
      use: {
        browserName: 'chromium',
        screenshot: 'off',
        storageState: STORAGE_STATE_PATH,
      },
    },
  ],
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
  ],
})
