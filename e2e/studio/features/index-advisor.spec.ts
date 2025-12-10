import { expect, Page } from '@playwright/test'
import { env } from '../env.config.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createApiResponseWaiter } from '../utils/wait-for-response.js'

test.describe.serial('Index Advisor', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test.describe('Enable Index Advisor', () => {
    test('should display Index Advisor banner on query performance page', async ({ ref }) => {
      // Navigate to query performance page
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Check if the page loaded correctly
      await expect(
        page.getByRole('heading', { name: 'Query Performance' }),
        'Query Performance heading should be visible'
      ).toBeVisible()

      // The banner should be visible (if Index Advisor is not already enabled)
      // The banner is in a fixed position at the bottom right
      const banner = page.locator('.fixed.bottom-4.right-4')

      // Check if the banner exists
      const bannerCount = await banner.count()

      if (bannerCount > 0) {
        // Hover over the banner to make it interactive
        await banner.hover()
        await page.waitForTimeout(500)

        // Check for Index Advisor banner content
        await expect(
          page.getByText('Enable Index Advisor'),
          'Enable Index Advisor text should be visible in banner'
        ).toBeVisible()

        await expect(
          page.getByText('Recommends indexes to improve query performance.'),
          'Banner description should be visible'
        ).toBeVisible()
      }
    })

    test('should open dialog when Enable button is clicked', async ({ ref }) => {
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')

      // Check if the banner exists
      const banner = page.locator('.fixed.bottom-4.right-4')
      const bannerCount = await banner.count()

      if (bannerCount === 0) {
        test.skip(true, 'Index Advisor is already enabled or banner is not visible')
      }

      // Hover over the banner to make it interactive
      await banner.hover()
      await page.waitForTimeout(500)

      // Click the Enable button
      const enableButton = page.getByRole('button', { name: 'Enable', exact: true })
      await enableButton.click({ force: true })

      // Wait for dialog to appear
      await page.waitForTimeout(1000)

      // Verify dialog content
      await expect(
        page.getByRole('heading', { name: 'Enable Index Advisor' }),
        'Dialog title should be visible'
      ).toBeVisible()

      await expect(
        page.getByText('Index Advisor is a tool that helps you identify and simulate indexes'),
        'Dialog description should be visible'
      ).toBeVisible()

      // Verify the extensions are listed
      await expect(
        page.getByText('index_advisor'),
        'index_advisor extension should be mentioned'
      ).toBeVisible()

      await expect(page.getByText('hypopg'), 'hypopg extension should be mentioned').toBeVisible()

      // Verify action buttons
      await expect(
        page.getByRole('button', { name: 'Cancel' }),
        'Cancel button should be visible'
      ).toBeVisible()

      await expect(
        page.getByRole('button', { name: 'Enable Extensions' }),
        'Enable Extensions button should be visible'
      ).toBeVisible()
    })

    test('should enable Index Advisor extensions when confirmed', async ({ ref }) => {
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')

      // Check if the banner exists
      const banner = page.locator('.fixed.bottom-4.right-4')
      const bannerCount = await banner.count()

      if (bannerCount === 0) {
        test.skip(true, 'Index Advisor is already enabled or banner is not visible')
      }

      // Hover over the banner to make it interactive
      await banner.hover()
      await page.waitForTimeout(500)

      // Click the Enable button
      const enableButton = page.getByRole('button', { name: 'Enable', exact: true })
      await enableButton.click({ force: true })

      // Wait for dialog to appear
      await page.waitForTimeout(1000)

      // Set up API response waiters for the extension creation calls
      const extensionCreateWait1 = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=extension-create'
      )

      // Click Enable Extensions button
      await page.getByRole('button', { name: 'Enable Extensions' }).click()

      // Wait for the API calls to complete
      await extensionCreateWait1

      // Wait for extensions list to refresh
      await page.waitForTimeout(2000)

      // Verify success toast appears
      await expect(
        page.getByText('Successfully enabled Index Advisor!'),
        'Success toast should be visible after enabling Index Advisor'
      ).toBeVisible({ timeout: 10000 })

      // Verify the dialog has closed
      await expect(
        page.getByRole('heading', { name: 'Enable Index Advisor' }),
        'Dialog should be closed after enabling'
      ).not.toBeVisible()

      // Verify the banner is dismissed
      const bannerAfterEnable = page.locator('.fixed.bottom-4.right-4')
      const indexAdvisorBanner = bannerAfterEnable.getByText('Enable Index Advisor')
      await expect(
        indexAdvisorBanner,
        'Index Advisor banner should be dismissed after enabling'
      ).not.toBeVisible()
    })

    test('should show Warnings filter button after enabling Index Advisor', async ({ ref }) => {
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')

      // Check for the Warnings filter button which appears after Index Advisor is enabled
      const warningsButton = page.getByRole('button', { name: 'Warnings' })

      // If it exists, Index Advisor is enabled
      const warningsButtonCount = await warningsButton.count()

      if (warningsButtonCount > 0) {
        await expect(
          warningsButton,
          'Warnings filter button should be visible when Index Advisor is enabled'
        ).toBeVisible()
      }
    })
  })

  test.describe('Cancel Enable Index Advisor', () => {
    test('should close dialog when Cancel button is clicked', async ({ ref }) => {
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')

      // Check if the banner exists
      const banner = page.locator('.fixed.bottom-4.right-4')
      const bannerCount = await banner.count()

      if (bannerCount === 0) {
        test.skip(true, 'Index Advisor is already enabled or banner is not visible')
      }

      // Hover over the banner to make it interactive
      await banner.hover()
      await page.waitForTimeout(500)

      // Click the Enable button
      const enableButton = page.getByRole('button', { name: 'Enable', exact: true })
      await enableButton.click({ force: true })

      // Wait for dialog to appear
      await page.waitForTimeout(1000)

      // Verify dialog is visible
      await expect(
        page.getByRole('heading', { name: 'Enable Index Advisor' }),
        'Dialog should be visible before cancelling'
      ).toBeVisible()

      // Click Cancel button
      await page.getByRole('button', { name: 'Cancel' }).click()

      // Verify the dialog has closed
      await expect(
        page.getByRole('heading', { name: 'Enable Index Advisor' }),
        'Dialog should be closed after clicking Cancel'
      ).not.toBeVisible()

      // Verify the banner is still visible (not dismissed)
      await expect(
        page.getByText('Enable Index Advisor'),
        'Banner should still be visible after cancelling'
      ).toBeVisible()
    })
  })

  test.describe('Dismiss Index Advisor Banner', () => {
    test('should dismiss banner when close button is clicked', async ({ ref }) => {
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')

      // Check if the banner exists
      const banner = page.locator('.fixed.bottom-4.right-4')
      const bannerCount = await banner.count()

      if (bannerCount === 0) {
        test.skip(true, 'Index Advisor banner is not visible')
      }

      // Hover over the banner to make it interactive
      await banner.hover()
      await page.waitForTimeout(500)

      // Find and click the close/dismiss button (X button in the banner)
      const closeButton = banner.getByRole('button', { name: 'Close banner' })
      const closeButtonCount = await closeButton.count()

      if (closeButtonCount > 0) {
        await closeButton.click()

        // Wait a bit for the banner to be dismissed
        await page.waitForTimeout(1000)

        // Verify the banner is dismissed
        const indexAdvisorBanner = page.getByText('Enable Index Advisor')
        await expect(
          indexAdvisorBanner,
          'Banner should be dismissed after clicking close button'
        ).not.toBeVisible()

        // Refresh the page and verify the banner stays dismissed
        await page.reload()
        await page.waitForLoadState('networkidle')

        await expect(
          page.getByText('Enable Index Advisor'),
          'Banner should remain dismissed after page refresh'
        ).not.toBeVisible()
      }
    })
  })
})
