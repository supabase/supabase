import type { editor as monacoEditor } from 'monaco-editor'

export type EditorSelection = {
  selection: string
  beforeSelection: string
  afterSelection: string
  startLineNumber: number
  endLineNumber: number
}

export function getEditorSelectionParts(
  editor: monacoEditor.IStandaloneCodeEditor
): EditorSelection | null {
  const selection = editor.getSelection()
  const model = editor.getModel()
  if (!model || !selection) return null

  const allLines = model.getLinesContent()

  const noSelection =
    selection.startLineNumber === selection.endLineNumber &&
    selection.startColumn === selection.endColumn

  if (noSelection) {
    return {
      selection: allLines.join('\n'),
      beforeSelection: '',
      afterSelection: '',
      startLineNumber: selection.startLineNumber,
      endLineNumber: selection.endLineNumber,
    }
  }

  const startLineIndex = selection.startLineNumber - 1
  const endLineIndex = selection.endLineNumber

  return {
    selection: allLines.slice(startLineIndex, endLineIndex).join('\n'),
    beforeSelection: allLines.slice(0, startLineIndex).join('\n') + '\n',
    afterSelection: '\n' + allLines.slice(endLineIndex).join('\n'),
    startLineNumber: selection.startLineNumber,
    endLineNumber: selection.endLineNumber,
  }
}
