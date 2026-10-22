import { describe, expect, it } from 'vitest'

import { getRowEditorHeader } from './HeaderTitle.utils'

describe('getRowEditorHeader', () => {
  it('returns the add-row prefix for new records', () => {
    expect(getRowEditorHeader('new')).toBe('Add new row to ')
  })

  it('returns the update-row prefix when editing', () => {
    expect(getRowEditorHeader('edit')).toBe('Update row from ')
  })

  it('returns the duplicate-row prefix when duplicating', () => {
    expect(getRowEditorHeader('duplicate')).toBe('Duplicate row in ')
  })
})
