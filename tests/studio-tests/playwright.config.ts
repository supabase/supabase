import { defineConfig, devices } from '@playwright/test'

// See https://playwright.dev/docs/test-configuration.

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL:
      process.env.ENV === 'local'
        ? 'http://localhost:8082'
        : process.env.ENV === 'staging'
          ? 'https://supabase.green/dashboard/'
          : '',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    launchOptions: {
      env: {
        NODE_ENV:
          process.env.ENV === 'local' ? 'test' : process.env.ENV === 'staging' ? 'staging' : '',
      },
    },
  },
  projects: [
    ...(process.env.ENV !== 'local'
      ? [
          {
            name: 'Authentication setup',
            testDir: './tests',
            testMatch: /.*\.setup\.ts/,
          },
        ]
      : []),
    {
      name: 'Common Functionality',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.ENV !== 'local' ? { storageState: 'playwright/.auth/user.json' } : {}),
        viewport: { width: 1366, height: 768 },
      },
      testDir: './tests/common-functionality',
      dependencies: process.env.ENV !== 'local' ? ['Authentication setup'] : undefined,
    },
    ...(process.env.ENV !== 'local'
      ? [
          {
            name: 'Production Functionality',
            use: {
              ...devices['Desktop Chrome'],
              storageState: 'playwright/.auth/user.json',
              viewport: { width: 1366, height: 768 },
            },
            testDir: './tests/production-functionality',
            dependencies: ['Authentication setup'],
          },
        ]
      : []),
  ],
  /* Run your local dev server before starting the tests */
  webServer:
    process.env.ENV === 'local'
      ? {
          // using npm run dev instead of turbo because turbo doesn't stop the server after a test (doesn't handle SIGTERM).
          command: 'pnpm dev',
          cwd: '../../apps/studio',
          url: 'http://localhost:8082',
          reuseExistingServer: !process.env.CI,
          env: { NODE_ENV: 'test' },
        }
      : undefined,
})
