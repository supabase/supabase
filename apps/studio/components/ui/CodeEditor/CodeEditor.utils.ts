import type { editor } from 'monaco-editor'

/**
 * Base Monaco editor options shared across Studio's editors so font size, indentation and
 * chrome stay consistent everywhere a Monaco editor is rendered. CodeEditor layers per-instance
 * options (read-only, line numbers) on top; GraphiQL (which runs its own Monaco instance) layers
 * its own padding/glyphMargin on top via `editor.updateOptions`.
 *
 * Keep this as the single source of truth — don't redeclare these values at call sites.
 */
export const BASE_MONACO_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  tabSize: 2,
  fontSize: 13,
  minimap: { enabled: false },
  wordWrap: 'on',
  fixedOverflowWidgets: false,
  contextmenu: true,
  scrollBeyondLastLine: false,
}

export const alignEditor = (editor: editor.IStandaloneCodeEditor) => {
  // Add margin above first line
  editor.changeViewZones((accessor) => {
    accessor.addZone({
      afterLineNumber: 0,
      heightInPx: 4,
      domNode: document.createElement('div'),
    })
  })
}

/**
 * The text a "run" gesture should act on: the current selection if there is one
 * (a collapsed cursor has an empty range, so `getValueInRange` returns `''` and
 * this falls through), otherwise the full editor value.
 */
export const getEditorValueOrSelection = (
  editor: editor.IStandaloneCodeEditor
): string | undefined => {
  const selection = editor.getSelection()
  const selectedValue = selection ? editor.getModel()?.getValueInRange(selection) : undefined
  return selectedValue || editor.getValue()
}
