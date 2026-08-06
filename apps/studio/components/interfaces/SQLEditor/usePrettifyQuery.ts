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

    // pg formatting can mangle ClickHouse syntax (backtick identifiers), so
    // Prettify is a no-op for logs snippets — the UI also hides the affordance.
    if (snippet?.snippet.type === 'log_sql') return

    if (editor.isReady() && project) {
      const fallback = snippet?.snippet.content?.unchecked_sql
      const sql = editor.getSql(fallback)
      if (sql === undefined) return

      const formattedSql = formatSql(sql)
      editor.replaceAll(formattedSql, 'apply-prettify-edit')
      snapV2.setSql({ id, sql: formattedSql })
    }
  }, [editor, id, isDiffOpen, project, snapV2])
}
