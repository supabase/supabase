import { expect } from '@playwright/test'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'

test.describe('Project', async () => {
  test('Can navigate to project home page', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${ref}`))

    await expect(page.getByRole('link', { name: 'Tables' })).toBeVisible()
  })
})
