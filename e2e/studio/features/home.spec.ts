import { expect } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

test.describe('Project', async () => {
  test('Can navigate to project home page', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${ref}`))

    // The home page has 2 variants (classic and new). Both render an H1 heading.
    // Assert on a stable, variant-agnostic selector.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
