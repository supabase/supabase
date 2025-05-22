import { defineConfig } from '@playwright/test'
import { ENV_URLS, ENV, STORAGE_STATE_PATH } from './env.config'

const IS_CI = !!process.env.CI

export default defineConfig({
  timeout: 60 * 1000,
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  forbidOnly: IS_CI,
  retries: 3,
  use: {
    baseURL: ENV_URLS[ENV],
    screenshot: 'off',
    video: 'retain-on-failure',
    headless: IS_CI,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'Features',
      testDir: './features',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
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
