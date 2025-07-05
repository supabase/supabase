import { DiffEditor } from '@monaco-editor/react'
import { editor as monacoEditor } from 'monaco-editor'

interface DiffViewerProps {
  /** Original/left hand side content (optional) */
  original?: string
  /** Modified/right hand side content */
  modified: string | undefined
  /** Language identifier understood by Monaco */
  language: string
  /** Height for the editor container */
  height?: string | number
  /** Whether to render diffs side-by-side */
  sideBySide?: boolean
}

// Centralised set of options so all diff editors look the same
const DEFAULT_OPTIONS: monacoEditor.IStandaloneDiffEditorConstructionOptions = {
  readOnly: true,
  renderSideBySide: false,
  minimap: { enabled: false },
  wordWrap: 'on',
  lineNumbers: 'on',
  folding: false,
  padding: { top: 16, bottom: 16 },
  lineNumbersMinChars: 3,
  fontSize: 13,
  scrollBeyondLastLine: false,
}

export const DiffViewer = ({
  original = '',
  modified = '',
  language,
  height = '100%',
  sideBySide = false,
}: DiffViewerProps) => (
  <DiffEditor
    theme="supabase"
    language={language}
    height={height}
    original={original}
    modified={modified}
    options={{ ...DEFAULT_OPTIONS, renderSideBySide: sideBySide }}
  />
)

export default DiffViewer
