import { describe, expect, test } from 'vitest'

import { shouldOpenLastTableOnEditorIndex } from './TableEditorIndex.utils'

describe('shouldOpenLastTableOnEditorIndex', () => {
  test('opens the last table on a fresh visit', () => {
    expect(shouldOpenLastTableOnEditorIndex({ isHistoryTraverse: false })).toBe(true)
  })

  test('stays on the list after Back or Forward', () => {
    expect(shouldOpenLastTableOnEditorIndex({ isHistoryTraverse: true })).toBe(false)
  })
})
