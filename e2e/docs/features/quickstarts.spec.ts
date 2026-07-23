import { expect, test } from '@playwright/test'

import { collectDocsOwnedLinks } from '../utils/docs-links.js'

const QUICKSTART_PATH = '/docs/guides/getting-started/quickstarts/nextjs'
const ARTICLE_SELECTOR = '#sb-docs-guide-main-article'

test.describe('Next.js quickstart', () => {
  test('loads and docs-owned article links resolve', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    expect(baseURL, 'A Playwright base URL should be configured').toBeTruthy()

    const response = await page.goto(QUICKSTART_PATH)
    expect(response, `Expected a response for ${QUICKSTART_PATH}`).not.toBeNull()
    expect(
      response!.ok(),
      `Quickstart page should return a successful status, got ${response!.status()}`
    ).toBeTruthy()

    const article = page.locator(ARTICLE_SELECTOR)
    await expect(article, 'Guide article should be present').toBeVisible()
    await expect(
      article.getByRole('heading', { level: 1 }),
      'Guide article should include an h1'
    ).toBeVisible()

    const links = await collectDocsOwnedLinks(page, baseURL!)

    for (const url of links) {
      try {
        const linkResponse = await page.request.get(url)
        expect
          .soft(linkResponse.ok(), `${url} should resolve (status ${linkResponse.status()})`)
          .toBeTruthy()
      } catch (error) {
        expect
          .soft(
            null,
            `${url} should be reachable (${error instanceof Error ? error.message : error})`
          )
          .toBeTruthy()
      }
    }
  })
})
