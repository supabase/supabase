import type { editor } from 'monaco-editor'
import { describe, expect, it } from 'vitest'

import { getEditorValueOrSelection } from './CodeEditor.utils'

const buildEditor = ({
  value,
  selectedValue,
  hasSelection,
}: {
  value: string
  selectedValue?: string
  hasSelection: boolean
}): editor.IStandaloneCodeEditor => {
  return {
    getValue: () => value,
    getSelection: () => (hasSelection ? {} : null),
    getModel: () => ({ getValueInRange: () => selectedValue }),
  } as unknown as editor.IStandaloneCodeEditor
}

describe('getEditorValueOrSelection', () => {
  it('returns the selected text when there is a non-empty selection', () => {
    const editorInstance = buildEditor({
      value: 'select * from a;\nselect * from b;',
      selectedValue: 'select * from b;',
      hasSelection: true,
    })

    expect(getEditorValueOrSelection(editorInstance)).toBe('select * from b;')
  })

  it('falls back to the full value when there is no selection', () => {
    const editorInstance = buildEditor({
      value: 'select * from a;',
      hasSelection: false,
    })

    expect(getEditorValueOrSelection(editorInstance)).toBe('select * from a;')
  })

  it('falls back to the full value when the selection is collapsed (empty range)', () => {
    const editorInstance = buildEditor({
      value: 'select * from a;',
      selectedValue: '',
      hasSelection: true,
    })

    expect(getEditorValueOrSelection(editorInstance)).toBe('select * from a;')
  })
})
