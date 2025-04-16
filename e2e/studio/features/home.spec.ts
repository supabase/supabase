import { expect } from '@playwright/test'
import { test } from '../utils/test'

test.describe('Project', async () => {
  test('Can navigate to project home page', async ({ page, ref }) => {
    await page.goto(`./project/${ref}`)
    await expect(page.getByRole('button', { name: 'Security Issues' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Project Status' })).toBeVisible()
  })
})
