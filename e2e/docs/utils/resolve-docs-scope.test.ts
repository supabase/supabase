import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  GUIDE_LIST_COMPONENT,
  GUIDE_LIST_COMPONENT_PAGES,
  resolveAllDocsPages,
  resolveDocsScope,
} from './resolve-docs-scope.ts'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))

test('maps a guide list component change to its sample pages', async () => {
  const result = await resolveDocsScope({
    changedFiles: [GUIDE_LIST_COMPONENT],
    repoRoot,
  })

  assert.deepEqual(result.pages, [...GUIDE_LIST_COMPONENT_PAGES].sort())
  assert.equal(result.skip, false)
})

test('ignores unrelated docs component changes', async () => {
  const result = await resolveDocsScope({
    changedFiles: ['apps/docs/components/Navigation/NavigationMenu/NavigationMenu.constants.ts'],
    repoRoot,
  })

  assert.deepEqual(result.pages, [])
  assert.equal(result.skip, true)
})

test('skips a guide that the navigation disables', async () => {
  const result = await resolveDocsScope({
    changedFiles: [
      'apps/docs/content/guides/ai-tools/agent-feedback.mdx',
      'apps/docs/content/guides/ai-tools/mcp.mdx',
    ],
    repoRoot,
  })

  assert.deepEqual(result.pages, ['/docs/guides/ai-tools/mcp'])
})

test('excludes a guide that the navigation disables from the full run', async () => {
  const pages = await resolveAllDocsPages(repoRoot)

  assert.ok(pages.includes('/docs/guides/ai-tools/mcp'))
  assert.ok(!pages.includes('/docs/guides/ai-tools/agent-feedback'))
})

test('reports pages over the page limit instead of dropping them silently', async () => {
  const changedFiles = ['a', 'b', 'c'].map(
    (slug) => `apps/docs/content/guides/ai-tools/${slug}.mdx`
  )

  const result = await resolveDocsScope({ changedFiles, repoRoot, maxPages: 2 })

  assert.deepEqual(result.pages, ['/docs/guides/ai-tools/a', '/docs/guides/ai-tools/b'])
  assert.deepEqual(result.truncated, ['/docs/guides/ai-tools/c'])
})

test('reports no truncated pages when everything fits', async () => {
  const result = await resolveDocsScope({
    changedFiles: ['apps/docs/content/guides/ai-tools/mcp.mdx'],
    repoRoot,
  })

  assert.deepEqual(result.truncated, [])
})

test('caps a default run at 20 pages and reports the rest', async () => {
  const changedFiles = Array.from(
    { length: 62 },
    (_, i) => `apps/docs/content/guides/ai-tools/page-${String(i).padStart(2, '0')}.mdx`
  )

  const result = await resolveDocsScope({ changedFiles, repoRoot })

  assert.equal(result.pages.length, 20)
  assert.equal(result.truncated.length, 42)
})

test('reports required pages dropped by the page limit', async () => {
  const result = await resolveDocsScope({
    changedFiles: [GUIDE_LIST_COMPONENT, 'apps/docs/content/guides/ai-tools/mcp.mdx'],
    repoRoot,
    maxPages: 2,
  })

  assert.equal(result.pages.length, 2)
  assert.deepEqual(
    [...result.pages, ...result.truncated].sort(),
    [...GUIDE_LIST_COMPONENT_PAGES, '/docs/guides/ai-tools/mcp'].sort()
  )
})
