import { expect } from '@playwright/test'

import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

test.describe('StatusPageBanner', () => {
  test('incident banner does not show when no incident flag is set', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${ref}`))

    // Wait for page to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 })

    // Verify the incident banner is NOT visible (no flag is set)
    const incidentBanner = page.getByText('We are investigating a technical issue')
    await expect(incidentBanner).not.toBeVisible()
  })
})
