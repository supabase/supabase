import { Page } from '@playwright/test'

/**
 * Waits for a API response for a specific endpoint before continuing the playwright test.
 * @param page - Playwright page object
 * @param ref - Project reference
 * @param endpoint - The endpoint to wait for (e.g., 'types', 'triggers')
 */
export async function waitForApiResponse(page: Page, ref: string, endpoint: string): Promise<void> {
  await page.waitForResponse(
    (response) =>
      response.url().includes(`pg-meta/${ref}/${endpoint}`) ||
      response.url().includes(`pg-meta/default/${endpoint}`)
  )
}
