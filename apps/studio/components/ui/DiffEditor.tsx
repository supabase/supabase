import { DiffEditor as BaseDiffEditor } from '@monaco-editor/react'
import type { editor as monacoEditor } from 'monaco-editor'

interface DiffViewerProps {
  /** Original/left hand side content (optional) */
  original?: string
  /** Modified/right hand side content */
  modified: string | undefined
  /** Language identifier understood by Monaco */
  language?: string
  /** Height for the editor container */
  height?: string | number
  /** Diff Editor Options */
  options?: monacoEditor.IStandaloneDiffEditorConstructionOptions
  onMount?: (editor: monacoEditor.IStandaloneDiffEditor) => void
}

// Centralised set of options so all diff editors look the same
const DEFAULT_OPTIONS: monacoEditor.IStandaloneDiffEditorConstructionOptions = {
  fontSize: 13,
  minimap: { enabled: false },
  wordWrap: 'on',
  lineNumbers: 'on',
  folding: false,
  lineNumbersMinChars: 3,
  scrollBeyondLastLine: false,
  renderSideBySide: false,
  padding: { top: 4 },
}

export const DiffEditor = ({
  original = '',
  modified = '',
  language = 'pgsql',
  height = '100%',
  options,
  onMount,
}: DiffViewerProps) => (
  <BaseDiffEditor
    // [Joshen] These ones are meant to solve a UI issue that seems to only be happening locally
    // Happens when you use the inline assistant in the SQL Editor and accept the suggestion
    // Error: TextModel got disposed before DiffEditorWidget model got reset
    keepCurrentOriginalModel
    keepCurrentModifiedModel
    theme="supabase"
    language={language}
    height={height}
    original={original}
    modified={modified}
    options={{ ...DEFAULT_OPTIONS, ...options }}
    onMount={onMount}
  />
)
