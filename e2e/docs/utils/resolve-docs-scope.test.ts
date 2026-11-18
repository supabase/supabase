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
