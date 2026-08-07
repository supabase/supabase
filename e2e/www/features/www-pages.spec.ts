import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Result } from 'axe-core'

import { parsePagePaths } from '../../shared/paths.ts'

const ENFORCED_RULES = ['page-has-heading-one']

const pagePaths = parsePagePaths(process.env.WWW_E2E_PAGE_PATHS)

function summarize(violations: Result[]): string {
  return violations
    .map(
      (violation) =>
        `  ${violation.id} (${violation.nodes.length} node(s)): ${violation.help}\n` +
        violation.nodes.map((node) => `    ${node.target.join(' ')}`).join('\n')
    )
    .join('\n')
}

test.describe('WWW content pages', () => {
  test('resolved page list must not be empty', () => {
    expect(
      pagePaths.length,
      'No pages to test. `pnpm e2e:www` resolves pages from git changes by default, ' +
        'or set WWW_E2E_PAGE_PATHS explicitly.'
    ).toBeGreaterThan(0)
  })

  for (const pagePath of pagePaths) {
    test(`${pagePath} loads and passes enforced a11y rules @a11y`, async ({ page }) => {
      const response = await page.goto(pagePath)
      expect(
        response?.ok(),
        `${pagePath} should return a successful status, got ${response?.status()}`
      ).toBeTruthy()

      const { violations } = await new AxeBuilder({ page })
        .setLegacyMode(true)
        .withRules(ENFORCED_RULES)
        .analyze()

      expect(
        violations.map((violation) => violation.id),
        `${pagePath} violates enforced a11y rules (${ENFORCED_RULES.join(', ')}):\n` +
          summarize(violations)
      ).toEqual([])
    })
  }
})
