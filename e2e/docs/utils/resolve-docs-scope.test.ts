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

test('checks links on every page and limits only the accessibility scan', async () => {
  const changedFiles = ['a', 'b', 'c'].map(
    (slug) => `apps/docs/content/guides/ai-tools/${slug}.mdx`
  )

  const result = await resolveDocsScope({ changedFiles, repoRoot, maxA11yPages: 2 })

  assert.deepEqual(result.pages, [
    '/docs/guides/ai-tools/a',
    '/docs/guides/ai-tools/b',
    '/docs/guides/ai-tools/c',
  ])
  assert.deepEqual(result.a11yPages, ['/docs/guides/ai-tools/a', '/docs/guides/ai-tools/b'])
  assert.deepEqual(result.truncated, ['/docs/guides/ai-tools/c'])
})

test('reports nothing truncated when every page gets the accessibility scan', async () => {
  const result = await resolveDocsScope({
    changedFiles: ['apps/docs/content/guides/ai-tools/mcp.mdx'],
    repoRoot,
  })

  assert.deepEqual(result.a11yPages, result.pages)
  assert.deepEqual(result.truncated, [])
})

test('keeps every page in a large change and caps the accessibility scan at 20', async () => {
  const changedFiles = Array.from(
    { length: 82 },
    (_, i) => `apps/docs/content/guides/ai-tools/page-${String(i).padStart(2, '0')}.mdx`
  )

  const result = await resolveDocsScope({ changedFiles, repoRoot })

  assert.equal(result.pages.length, 82)
  assert.equal(result.a11yPages.length, 20)
  assert.equal(result.truncated.length, 62)
  assert.deepEqual(
    [...result.a11yPages, ...result.truncated].sort(),
    result.pages,
    'every page is either scanned or reported'
  )
})

test('gives required pages the accessibility scan before other pages', async () => {
  const result = await resolveDocsScope({
    changedFiles: [GUIDE_LIST_COMPONENT, 'apps/docs/content/guides/ai-tools/mcp.mdx'],
    repoRoot,
    maxA11yPages: 3,
  })

  assert.deepEqual(result.a11yPages, [...GUIDE_LIST_COMPONENT_PAGES].sort())
  assert.deepEqual(result.truncated, ['/docs/guides/ai-tools/mcp'])
  assert.equal(result.pages.length, 4)
})

test('always scans at least one page', async () => {
  const result = await resolveDocsScope({
    changedFiles: [
      'apps/docs/content/guides/ai-tools/a.mdx',
      'apps/docs/content/guides/ai-tools/b.mdx',
    ],
    repoRoot,
    maxA11yPages: 0,
  })

  assert.equal(result.a11yPages.length, 1)
  assert.equal(result.truncated.length, 1)
})

test('reports required pages dropped by a tiny accessibility limit', async () => {
  const result = await resolveDocsScope({
    changedFiles: [GUIDE_LIST_COMPONENT, 'apps/docs/content/guides/ai-tools/mcp.mdx'],
    repoRoot,
    maxA11yPages: 2,
  })

  assert.equal(result.a11yPages.length, 2)
  assert.deepEqual(
    [...result.a11yPages, ...result.truncated].sort(),
    [...GUIDE_LIST_COMPONENT_PAGES, '/docs/guides/ai-tools/mcp'].sort()
  )
})
