import { defineConfig } from '@playwright/test'
import { ENV_URLS, ENV, STORAGE_STATE_PATH } from './env.config'

export default defineConfig({
  timeout: 30 * 1000,
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  use: {
    baseURL: ENV_URLS[ENV],
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retry-with-video',
    headless: true,
  },
  projects: [
    {
      name: 'Global Setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'Features',
      testDir: './features',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['Global Setup'],
      use: {
        storageState: STORAGE_STATE_PATH,
      },
    },
  ],
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
})
