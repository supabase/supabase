import { Page, Response } from '@playwright/test'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Waits for a API response for a specific endpoint before continuing the playwright test. If no api response we still continue with the playwright tests.
 * @param page - Playwright page object
 * @param basePath - Base path of API endpoint to wait for (e.g. 'pg-meta', 'platform/projects', etc.)
 * @param ref - Project reference
 * @param action - Action path of API endpoint to wait for (e.g. 'types', 'triggers', 'content', etc.)
 * @param options - Optional object which checks more scenarios
 */
export async function waitForApiResponseWithTimeout(
  page: Page,
  urlMatcher: string | RegExp | ((response: Response) => boolean),
  timeOutMs?: number
): Promise<Response | null> {
  try {
    return await page.waitForResponse(urlMatcher, { timeout: timeOutMs || 5000 })
  } catch (error) {
    if (error.name === 'TimeoutError') {
      return null
    }
    throw error
  }
}
