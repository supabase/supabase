// apps/studio/playwright.config.ts
import { defineConfig } from '@playwright/test';
const extraIgnores = process.env.CI_TEST_IGNORE
  ? process.env.CI_TEST_IGNORE.split(',').map((p) => p.trim())
  : [];

export default defineConfig({
  testDir: './tests',
  testIgnore: [
    '**/node_modules/**',
    ...extraIgnores,  
  ],
  timeout: 60_000,               // allow 1 min per test
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.STUDIO_BASE_URL || 'http://localhost:8082',
    headless: true,
    viewport: { width: 1280, height: 720 },

    // 🔑  Basic‑Auth that protects every Studio route
    httpCredentials: {
      username: process.env.DASHBOARD_USERNAME || 'supabase',
      password:
        process.env.DASHBOARD_PASSWORD ||
        'this_password_is_insecure_and_should_be_updated',
    },
  },
});
