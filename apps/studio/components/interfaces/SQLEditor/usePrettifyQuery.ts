import { useCallback } from 'react'

import { getEditorSql } from './SQLEditor.utils'
import { useSQLEditorContext } from './SQLEditorContext'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'
import {
  getSqlEditorV2StateSnapshot,
  useSqlEditorV2StateSnapshot,
} from '@/state/sql-editor/sql-editor-state'

/**
 * Formats the current editor SQL in place (respecting a selection) and writes
 * the formatted SQL back to the snippet store. No-op while a diff is open.
 */
export function usePrettifyQuery({ id, isDiffOpen }: { id: string; isDiffOpen: boolean }) {
  const { editorRef } = useSQLEditorContext()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()

  return useCallback(async () => {
    if (isDiffOpen) return

    // use the latest state
    const state = getSqlEditorV2StateSnapshot()
    const snippet = state.snippets[id]

    if (editorRef.current && project) {
      const editor = editorRef.current
      const sql = getEditorSql(editor, snippet?.snippet.content?.unchecked_sql)
      const formattedSql = formatSql(sql)

      const editorModel = editorRef?.current?.getModel()
      if (editorRef.current && editorModel) {
        editorRef.current.executeEdits('apply-prettify-edit', [
          {
            text: formattedSql,
            range: editorModel.getFullModelRange(),
          },
        ])
        snapV2.setSql({ id, sql: formattedSql })
      }
    }
  }, [editorRef, id, isDiffOpen, project, snapV2])
}
