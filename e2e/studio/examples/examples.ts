import { expect } from '@playwright/test'
import { isEnv } from '../env.config'
import { test } from '../utils/test'

/**
 * * Example tests for Studio.
 * Tips:
 * - Use the test utility instead of playwrights test.
 *    import { test } from '../utils/test'
 * - Use the isEnv utility to check the environment.
 *    import { isEnv } from '../env.config'
 * - Make tests easy to debug by adding enough expect() statements.
 */

/**
 * * Test that is skipped in self-hosted environment
 */
test('Loads the page 1', async ({ page }) => {
  if (isEnv('selfhosted')) return

  await page.goto('https://www.supabase.com')
  await expect(
    page.getByRole('heading', { name: 'Build in a weekend Scale to millions' })
  ).toBeVisible()
})

/**
 * * Test that only runs in staging and production environments
 */
test('Loads the page 2', async ({ page }) => {
  if (!isEnv(['staging', 'production'])) return

  await page.goto('https://www.supabase.com')
  await expect(
    page.getByRole('heading', { name: 'Build in a weekend Scale to millions' })
  ).toBeVisible()
})

/**
 * * Test that navigates to a project by ref
 * Make sure to set up the project in the `.env.local` file.
 */
test('Navigates to a project by ref', async ({ page, ref }) => {
  await page.goto(`${process.env.BASE_URL}/project/${ref}`)
  await expect(page.getByRole('heading', { name: 'Project Home' })).toBeVisible()
})

/**
 * * Test that mocks some API calls
 */

const mockRes = {
  data: [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
    {
      id: 2,
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
    },
  ],
}

test.beforeEach(async ({ context }) => {
  context.route('*/**/users*', async (route, request) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockRes),
    })
  })
})

test('Mocks some API calls', async ({ page }) => {
  // ... Run some code that depends on that API call
})
