import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { parsePagePaths } from '../../shared/paths.ts'
import {
  articleSelectorForPagePath,
  browserLikeUserAgent,
  collectDocsOwnedLinks,
} from '../utils/docs-links.js'

const pagePaths = parsePagePaths(process.env.DOCS_E2E_PAGE_PATHS)

test.describe('Docs owned pages', () => {
  // Without this, every test in this file runs on one worker.
  test.describe.configure({ mode: 'parallel' })

  test('resolved page list must not be empty', () => {
    expect(
      pagePaths.length,
      'No pages to test. `pnpm e2e:docs` resolves pages from git changes by default, ' +
        'or set DOCS_E2E_PAGE_PATHS explicitly.'
    ).toBeGreaterThan(0)
  })

  for (const pagePath of pagePaths) {
    test(`${pagePath} loads and docs-owned article links resolve`, async ({ page }, testInfo) => {
      const baseURL = testInfo.project.use.baseURL
      expect(baseURL, 'A Playwright base URL should be configured').toBeTruthy()

      const articleSelector = articleSelectorForPagePath(pagePath)
      const response = await page.goto(pagePath)
      expect(response, `Expected a response for ${pagePath}`).not.toBeNull()
      expect(
        response!.ok(),
        `Page should return a successful status, got ${response!.status()}`
      ).toBeTruthy()

      const article = page.locator(articleSelector)
      await expect(article, 'Page article should be present').toBeVisible()

      const links = await collectDocsOwnedLinks(page, baseURL!, articleSelector)
      const userAgent = await browserLikeUserAgent(page)

      for (const url of links) {
        try {
          const linkResponse = await page.request.get(url, { headers: { 'user-agent': userAgent } })
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
  }

  for (const pagePath of pagePaths) {
    test(`${pagePath} has a valid heading hierarchy @a11y`, async ({ page }) => {
      const articleSelector = articleSelectorForPagePath(pagePath)
      const response = await page.goto(pagePath)
      expect(response?.ok(), `Expected a successful response for ${pagePath}`).toBeTruthy()

      const axeResults = await new AxeBuilder({ page })
        .include(articleSelector)
        .withRules(['heading-order', 'page-has-heading-one'])
        .analyze()

      expect(
        axeResults.violations,
        `Heading hierarchy issues in ${articleSelector}:\n${JSON.stringify(axeResults.violations, null, 2)}`
      ).toEqual([])
    })
  }
})
