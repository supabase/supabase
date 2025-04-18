import { expect } from '@playwright/test'
import { test } from '../utils/test'
import { ENV } from '../env.config'

test.describe('Project', async () => {
  test('Can navigate to project home page', async ({ page, ref }) => {
    console.log(page.url())
    await page.goto(`/project/${ref}`)

    if (ENV.includes('selfhosted')) {
      await expect(page.getByRole('heading', { name: 'Welcome to your project' })).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: 'Security Issues' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Project Status' })).toBeVisible()
    }
  })
})
