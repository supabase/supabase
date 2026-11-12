import type { ComponentType } from 'react'

/** The SQL editor a host passes in: Monaco in Studio, CodeMirror in MCP Apps hosts. */
export interface SqlEditorProps {
  value: string
  source: 'database' | 'logs'
  onChange: (value: string) => void
  /** Cmd/Ctrl+Enter. */
  onRun: () => void
  readOnly?: boolean
  className?: string
}

export type SqlEditorComponent = ComponentType<SqlEditorProps>
