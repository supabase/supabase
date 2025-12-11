import { defineConfig } from '@playwright/test'
import { env, STORAGE_STATE_PATH } from './env.config.js'

const IS_CI = !!process.env.CI

const WEB_SERVER_TIMEOUT = Number(process.env.WEB_SERVER_TIMEOUT) || 10 * 60 * 1000
const WEB_SERVER_PORT = Number(process.env.WEB_SERVER_PORT) || 8082

// 15 minutes for platform, 2 minutes for self-hosted. Takes longer to setup a full project on platform.
const setupTimeout = env.IS_PLATFORM ? 15 * 60 * 1000 : 120 * 1000

const createWebServerConfig = () => {
  if (env.IS_PLATFORM && env.IS_APP_RUNNING_ON_LOCALHOST) {
    return {
      command: 'pnpm --workspace-root run e2e:setup:platform',
      port: WEB_SERVER_PORT,
      timeout: WEB_SERVER_TIMEOUT,
      reuseExistingServer: true,
    }
  }

  // Apps running on runner using the vercel staging environment
  if (env.IS_PLATFORM && !env.IS_APP_RUNNING_ON_LOCALHOST) {
    return undefined
  }

  return {
    command: 'pnpm --workspace-root run e2e:setup:selfhosted',
    port: WEB_SERVER_PORT,
    timeout: WEB_SERVER_TIMEOUT,
    reuseExistingServer: true,
  }
}

export default defineConfig({
  timeout: 120 * 1000,
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  forbidOnly: IS_CI,
  retries: IS_CI ? 5 : 0,
  maxFailures: 3,
  // Due to rate API rate limits run tests in serial mode on platform.
  fullyParallel: !env.IS_PLATFORM,
  workers: env.IS_PLATFORM ? 1 : 5,
  use: {
    baseURL: env.STUDIO_URL,
    screenshot: 'off',
    video: 'retain-on-failure',
    headless: true || IS_CI,
    trace: 'retain-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
    extraHTTPHeaders: {
      'x-vercel-protection-bypass':
        process.env.VERCEL_AUTOMATION_BYPASS_SELFHOSTED_STUDIO || 'false',
      'x-vercel-set-bypass-cookie': 'true',
    },
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      timeout: setupTimeout,
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
  webServer: createWebServerConfig(),
})
