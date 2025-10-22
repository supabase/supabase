import { defineConfig } from '@playwright/test'
import { env, STORAGE_STATE_PATH } from './env.config'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.local') })

const IS_CI = !!process.env.CI

export default defineConfig({
  timeout: 90 * 1000,
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  forbidOnly: IS_CI,
  retries: IS_CI ? 3 : 0,
  maxFailures: 3,
  fullyParallel: true,
  use: {
    baseURL: env.STUDIO_URL,
    screenshot: 'off',
    video: 'retain-on-failure',
    headless: true || IS_CI,
    trace: 'retain-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SELFHOSTED_STUDIO,
      'x-vercel-set-bypass-cookie': 'true',
    },
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
        // Only use storage state if authentication is enabled. When AUTHENTICATION=false
        // we should not require a pre-generated storage state file.
        storageState: env.AUTHENTICATION ? STORAGE_STATE_PATH : undefined,
      },
    },
  ],
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
  ],
})
