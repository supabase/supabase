import assert from 'node:assert/strict'
import test from 'node:test'

import { formatAnnotation, formatJobSummary, formatLocalWarning } from '../../shared/truncation.ts'

const pages = Array.from({ length: 80 }, (_, i) => `/docs/guides/ai/page-${i}`)
const truncation = { label: 'docs', check: 'accessibility scan', limit: 20, truncated: pages }

test('annotation shows only the count for many skipped pages', () => {
  const annotation = formatAnnotation(truncation)

  assert.ok(!annotation.includes('\n'))
  assert.ok(annotation.startsWith('80 in-scope docs page(s) did not get the accessibility scan'))
  assert.ok(annotation.includes('the limit is 20.'))
  assert.ok(!annotation.includes('/docs/guides/'))
  assert.ok(annotation.includes('See the job summary for the full list.'))
})

test('annotation names the pages when only a few are skipped', () => {
  const annotation = formatAnnotation({ ...truncation, truncated: pages.slice(0, 5) })

  for (const page of pages.slice(0, 5)) assert.ok(annotation.includes(page))
})

test('annotation drops the names once more than five are skipped', () => {
  const annotation = formatAnnotation({ ...truncation, truncated: pages.slice(0, 6) })

  assert.ok(!annotation.includes('/docs/guides/'))
})

test('job summary lists every page and a ready-to-paste page_paths value', () => {
  const summary = formatJobSummary(truncation)

  for (const page of pages) assert.ok(summary.includes(`- ${page}\n`))
  assert.ok(summary.includes(`\`\`\`\n${pages.join(',')}\n\`\`\``))
  assert.ok(summary.includes('<details>'))
  assert.ok(summary.includes('Set `base_url` to this pull request\'s preview'))
  assert.ok(!summary.includes('still ran'))
})

test('local warning shows only the count for many skipped pages', () => {
  const warning = formatLocalWarning(truncation, 'DOCS_E2E_PAGE_PATHS')

  assert.ok(
    warning.includes('80 in-scope docs page(s) are over the 20-page accessibility scan limit')
  )
  assert.ok(!warning.includes('/docs/guides/'))
})

test('local warning names the env var and the all-pages command', () => {
  const warning = formatLocalWarning(truncation, 'DOCS_E2E_PAGE_PATHS')

  assert.ok(warning.includes("won't get it"))
  assert.ok(warning.includes('set DOCS_E2E_PAGE_PATHS to them'))
  assert.ok(warning.includes('`pnpm e2e:docs:all`'))
})
