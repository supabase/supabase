import { DiffType } from './SQLEditor.types'
import { useSqlEditorAssistant, useSqlEditorRun, useSqlEditorSnippet } from './SQLEditorControllers'
import { LegacyLogsRewriteBanner as SharedLegacyLogsRewriteBanner } from '@/components/interfaces/Settings/Logs/LegacyLogsRewriteBanner'
import {
  getSqlEditorV2StateSnapshot,
  useSqlEditorV2StateSnapshot,
} from '@/state/sql-editor/sql-editor-state'

/**
 * Legacy Logs Explorer saved queries open in the SQL editor as `log_sql` snippets,
 * and those queries error against the ClickHouse-backed endpoint the editor runs
 * them on. This adapts the shared rewrite offer to the SQL editor's snippet store
 * and routes an accepted rewrite into the editor's existing AI diff view, so the
 * user accepts or discards it the same way as any other AI edit rather than
 * having the snippet rewritten under them.
 *
 * Mount with `key={id}` so the offer resets when the user switches snippets. This
 * component must NOT be conditionally mounted by its parent — it hides itself, so
 * that opening a diff doesn't unmount it and throw away a dismissal.
 */
export const LegacyLogsRewriteBanner = () => {
  const { id } = useSqlEditorSnippet()
  const { runSource } = useSqlEditorRun()
  const {
    diff: { isDiffOpen, setSourceSqlDiff, setSelectedDiffType },
  } = useSqlEditorAssistant()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const sql = snapV2.snippets[id]?.snippet.content?.unchecked_sql ?? ''

  return (
    <SharedLegacyLogsRewriteBanner
      isLogsSource={runSource._tag === 'logs'}
      sql={sql}
      // Rewrite exactly what's in the editor now, not the debounced value the
      // visibility check used — they differ if the user clicked mid-edit.
      readSql={() =>
        getSqlEditorV2StateSnapshot().snippets[id]?.snippet.content?.unchecked_sql ?? ''
      }
      onProposal={({ original, modified }) => {
        setSourceSqlDiff({ original, modified })
        setSelectedDiffType(DiffType.Modification)
      }}
      hidden={isDiffOpen}
    />
  )
}
