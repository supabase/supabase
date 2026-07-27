import { useCallback } from 'react'

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
  const { editor } = useSQLEditorContext()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()

  return useCallback(async () => {
    if (isDiffOpen) return

    // use the latest state
    const state = getSqlEditorV2StateSnapshot()
    const snippet = state.snippets[id]

    if (editor.isReady() && project) {
      const sql = editor.getSql(snippet?.snippet.content?.unchecked_sql)
      if (sql === undefined) return

      const formattedSql = formatSql(sql)
      editor.replaceAll(formattedSql, 'apply-prettify-edit')
      snapV2.setSql({ id, sql: formattedSql })
    }
  }, [editor, id, isDiffOpen, project, snapV2])
}
