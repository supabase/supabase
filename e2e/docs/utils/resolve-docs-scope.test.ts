import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  GUIDE_LIST_COMPONENT,
  GUIDE_LIST_COMPONENT_PAGES,
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
