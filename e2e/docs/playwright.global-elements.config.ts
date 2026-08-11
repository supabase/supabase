import { defineConfig } from '@playwright/test'

const IS_CI = !!process.env.CI

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

// Never send the bypass secret anywhere that can't be a Supabase deployment.
function isSupabaseHost(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return (
      hostname === 'supabase.com' ||
      hostname.endsWith('.supabase.com') ||
      hostname.endsWith('.vercel.app')
    )
  } catch {
    return false
  }
}

// Separate config, so `pnpm e2e:docs` never picks these up.
export default defineConfig({
  testDir: './global-elements',
  testMatch: /.*\.spec\.ts/,
  timeout: 120_000,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  // Report every page: an early stop hides findings from the rest.
  maxFailures: 0,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: true,
  workers: IS_CI ? 2 : undefined,
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    headless: true,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    extraHTTPHeaders:
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET && isSupabaseHost(BASE_URL)
        ? {
            'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
            'x-vercel-set-bypass-cookie': 'true',
          }
        : undefined,
  },
  reporter: IS_CI
    ? [['list'], ['html', { open: 'never', outputFolder: './playwright-report-global-elements' }]]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: './playwright-report-global-elements' }],
        ['json', { outputFile: './test-results/global-elements-results.json' }],
      ],
  outputDir: './test-results',
})
