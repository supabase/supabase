import { expect } from '@playwright/test'

import { env } from '../env.config.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

test.describe('Enabled features runtime override', () => {
  test.skip(
    env.IS_PLATFORM,
    'runtime override is only served on self-hosted; the hook is disabled when IS_PLATFORM'
  )

  test('GET /api/enabled-features-overrides returns an empty disabled_features list with no overrides set', async ({
    page,
  }) => {
    const res = await page.request.get(toUrl('/api/enabled-features-overrides'))

    expect(res.ok(), 'route should respond 2xx').toBeTruthy()

    const body = await res.json()
    expect(
      body,
      'route should return { disabled_features: [] } when no ENABLED_FEATURES_* env vars are set'
    ).toEqual({ disabled_features: [] })
  })

  test('UI hides the logs templates page when override disables logs:templates', async ({
    page,
    ref,
  }) => {
    await page.route('**/api/enabled-features-overrides', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ disabled_features: ['logs:templates'] }),
      })
    })

    await page.goto(toUrl(`/project/${ref}/logs/explorer/templates`))

    await expect(
      page.getByText('Looking for something?', { exact: true }),
      'UnknownInterface fallback should render when logs:templates is disabled by the runtime override'
    ).toBeVisible({ timeout: 15000 })
  })
})
