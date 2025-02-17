import { expect } from '@playwright/test'
import { test } from '../../base'

test.describe('Project', async () => {
  test('Can navigate to project home page', async ({ page, env, ref }) => {
    await page.goto(`./project/${ref}`)
    await expect(
      page.getByRole('heading', {
        name: env === 'local' ? 'Welcome to your project' : 'Playwright Test',
      })
    ).toBeVisible({ timeout: 10000 })
  })
})
