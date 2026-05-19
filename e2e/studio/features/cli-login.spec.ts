import { expect } from '@playwright/test'

import { env } from '../env.config.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

// Regression guard for CLI-1491. The dashboard CLI login page used to fire
// `POST /platform/cli/login` multiple times per page load because an unstable
// `navigate` reference re-triggered the effect, producing several duplicate
// personal access tokens per browser sign-in attempt.
test.describe('CLI browser login', () => {
  test.skip(!env.IS_PLATFORM, 'platform-only route')

  test('POST /platform/cli/login fires exactly once per page load', async ({ page }) => {
    let callCount = 0
    await page.route('**/platform/cli/login', async (route, request) => {
      if (request.method() !== 'POST') return route.continue()
      callCount += 1
      // Simulate real-world network latency. The original bug only surfaced
      // when responses took long enough for React to commit a few re-renders
      // before the await resolved; an immediate mock would hide the regression.
      await new Promise((resolve) => setTimeout(resolve, 400))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-4000-8000-000000000000',
          nonce: 'abcdefgh012345',
          access_token: 'enc',
          public_key: 'pk',
          inserted_at: new Date().toISOString(),
          expired_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        }),
      })
    })

    await page.goto(
      toUrl(
        '/cli/login?session_id=00000000-0000-4000-8000-000000000000&public_key=04abcd&token_name=e2e-test'
      )
    )

    // Wait for the navigate(`?device_code=ABCDEFGH`) to land
    await expect(page.getByLabel(/Verification code/i)).toBeVisible({ timeout: 10_000 })

    expect(callCount, 'dashboard should POST exactly once per session_id').toBe(1)
  })

  test('surfaces the platform error message instead of "Unknown error"', async ({ page }) => {
    await page.route('**/platform/cli/login', async (route, request) => {
      if (request.method() !== 'POST') return route.continue()
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 403,
          message:
            'User can have up to 20 personal access tokens. Please remove the excess tokens to create new ones.',
        }),
      })
    })

    await page.goto(
      toUrl(
        '/cli/login?session_id=00000000-0000-4000-8000-000000000001&public_key=04abcd&token_name=e2e-test'
      )
    )

    await expect(page.getByText(/User can have up to 20 personal access tokens/)).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/Error: Unknown error/)).not.toBeVisible()
  })
})
