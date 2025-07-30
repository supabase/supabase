import { defineConfig } from '@playwright/test'
import { env, STORAGE_STATE_PATH } from './env.config'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.local') })

const IS_CI = !!process.env.CI

const CI_TIMEOUT = 60 * 1000
const DEV_TIMEOUT = 30 * 1000

export default defineConfig({
  timeout: IS_CI ? CI_TIMEOUT : DEV_TIMEOUT,
  expect: {
    timeout: IS_CI ? CI_TIMEOUT : DEV_TIMEOUT,
  },
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  forbidOnly: IS_CI,
  retries: IS_CI ? 3 : 0,
  maxFailures: IS_CI ? 1 : undefined,
  use: {
    baseURL: env.STUDIO_URL,
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
