import { defineConfig } from '@playwright/test'
import { env, STORAGE_STATE_PATH } from './env.config'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.local') })

const IS_CI = !!process.env.CI

export default defineConfig({
  timeout: 60 * 1000,
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  forbidOnly: IS_CI,
  retries: IS_CI ? 3 : 1,
  use: {
    baseURL: env.STUDIO_URL,
    screenshot: 'off',
    video: 'retain-on-failure',
    headless: IS_CI,
    trace: 'retain-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
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
