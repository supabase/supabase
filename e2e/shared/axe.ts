import { AxeBuilder } from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import type { Result } from 'axe-core'

export const MAX_REPORTED_NODES = 5

export const MAX_REPORTED_HTML = 200

export type ScanOptions = {
  rules?: string[]
  tags?: string[]
  excludeRules?: string[]
  include?: string
  exclude?: string[]
}

export async function settleForAxe(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})

  await page
    .evaluate(
      ({ quietMs, capMs }) =>
        new Promise<void>((resolve) => {
          let timer: ReturnType<typeof setTimeout>
          const observer = new MutationObserver(() => {
            clearTimeout(timer)
            timer = setTimeout(finish, quietMs)
          })

          function finish() {
            clearTimeout(cap)
            clearTimeout(timer)
            observer.disconnect()
            resolve()
          }

          const cap = setTimeout(finish, capMs)
          timer = setTimeout(finish, quietMs)
          observer.observe(document.body, { subtree: true, childList: true, attributes: true })
        }),
      { quietMs: 500, capMs: 5_000 }
    )
    .catch(() => {})
}

// Legacy mode keeps cross-origin embeds out of the scan. Rules and tags are
// mutually exclusive in one axe run, so `rules` wins when both are given.
export async function scan(page: Page, options: ScanOptions): Promise<Result[]> {
  let builder = new AxeBuilder({ page }).setLegacyMode(true)

  if (options.include) builder = builder.include(options.include)
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector)
  if (options.rules) builder = builder.withRules(options.rules)
  else if (options.tags) builder = builder.withTags(options.tags)
  if (options.excludeRules?.length) builder = builder.disableRules(options.excludeRules)

  const { violations } = await builder.analyze()
  return violations
}

export function violationIds(violations: Result[]): string[] {
  return violations.map((violation) => violation.id)
}

export function formatViolations(
  violations: Result[],
  maxNodes: number = MAX_REPORTED_NODES
): string {
  return violations
    .map((violation) => {
      const shown = violation.nodes.slice(0, maxNodes)
      const hidden = violation.nodes.length - shown.length
      const nodes = shown
        .map(
          (node) => `    ${node.target.join(' ')}\n      ${node.html.slice(0, MAX_REPORTED_HTML)}`
        )
        .join('\n')
      const more = hidden > 0 ? `\n    … +${hidden} more node(s)` : ''

      return (
        `${violation.id} (${violation.impact ?? 'unknown'}, ${violation.nodes.length} node(s)): ` +
        `${violation.help}\n${nodes}${more}`
      )
    })
    .join('\n')
}
