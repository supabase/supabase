import { expect, test } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs/promises'

test.describe('Project Overview', () => {
  // Global mock
  test.beforeEach(async ({ context }) => {
    await context.route('**/api/projects', async (route) =>
      route.fulfill({
        status: 200,
        body: await fs.readFile(path.resolve(__dirname, '../../fixtures/projects.json'), 'utf-8'),
      })
    )
  })

  test('should have a heading with project name', async ({ page }) => {
    page.on('request', (request) => console.log('>>', request.method(), request.url()))
    page.on('response', (response) => console.log('<<', response.status(), response.url()))

    // Local mock
    await page.route('**/api/projects/default', async (route) =>
      route.fulfill({
        status: 200,
        body: await fs.readFile(
          path.resolve(__dirname, '../../fixtures/projects/default.json'),
          'utf-8'
        ),
      })
    )

    await page.goto('/project/default')
    await expect(page.getByText('[LIVE] supabase-com')).toBeVisible()
  })
})
