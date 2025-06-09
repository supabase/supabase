import { expect } from '@playwright/test'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'

test.describe('Project', async () => {
  test('Can navigate to project home page', async ({ page, ref }) => {
    console.log(page.url())
    await page.goto(toUrl(`/project/${ref}`))

    await expect(page.getByRole('button', { name: 'Project Status' })).toBeVisible()
  })
})
