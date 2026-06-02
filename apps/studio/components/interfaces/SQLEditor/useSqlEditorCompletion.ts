import type { Monaco } from '@monaco-editor/react'

import { useEditorHints } from '@/components/interfaces/Settings/Logs/Logs.utils'
import { useAddDefinitions } from '@/components/interfaces/SQLEditor/useAddDefinitions'
import { useNotebookEditorContext } from '@/state/notebook-editor-context'
import { useQueryExecutionSourceSnapshot } from '@/state/query-execution-source'

export const useSqlEditorCompletion = (id: string, monaco: Monaco | null) => {
  const querySourceState = useQueryExecutionSourceSnapshot()
  const notebookEditorContext = useNotebookEditorContext()
  const executionSource = notebookEditorContext?.querySource ?? querySourceState.executionSource
  const isLogsSource = executionSource === 'logs'

  useAddDefinitions(id, isLogsSource ? null : monaco)
  useEditorHints(isLogsSource)
}
