import { expect } from '@playwright/test'
import { test } from '../../base'

// [Joshen] This file is redundant, so once we start putting in production specific spec tests, can remove this

test.describe('Example', async () => {
  test('Can navigate to project home page', async ({ page, ref }) => {
    await page.goto(`./project/${ref}`)
    await expect(page.getByRole('heading', { name: 'Playwright Test' })).toBeVisible()
  })
})
