import { expect } from '@playwright/test'

import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

const FUNCTION_SLUG = 'error-code-docs'

test.describe('Edge Functions', () => {
  test('links an sb-error-code response to its documentation', async ({ page, ref }) => {
    await page.route(`**/api/v1/projects/${ref}/functions/${FUNCTION_SLUG}`, async (route) => {
      const timestamp = Date.now()
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000000',
          slug: FUNCTION_SLUG,
          name: FUNCTION_SLUG,
          version: 1,
          status: 'ACTIVE',
          entrypoint_path: `supabase/functions/${FUNCTION_SLUG}/index.ts`,
          created_at: timestamp,
          updated_at: timestamp,
        }),
      })
    })
    await page.route('**/api/edge-functions/test', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 401,
          headers: { 'sb-error-code': 'UNAUTHORIZED_INVALID_JWT_FORMAT' },
          body: '',
        }),
      })
    })

    await page.goto(toUrl(`/project/${ref}/functions/${FUNCTION_SLUG}`))
    await page.getByRole('button', { name: 'Test', exact: true }).click()

    const testResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/edge-functions/test') &&
        response.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'Send Request' }).click()
    expect(
      (await testResponse).ok(),
      'Studio proxy should return a successful response envelope'
    ).toBeTruthy()

    await expect(
      page.getByRole('link', {
        name: 'View documentation for UNAUTHORIZED_INVALID_JWT_FORMAT (opens in new tab)',
      }),
      'Error response should link to its documentation section'
    ).toHaveAttribute(
      'href',
      'https://supabase.com/docs/guides/functions/error-codes#unauthorizedinvalidjwtformat'
    )
  })
})
