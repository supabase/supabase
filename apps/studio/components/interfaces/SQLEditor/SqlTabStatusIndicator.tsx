import { useIsSqlEditorManualSaveEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { hasUnsavedChanges } from '@/state/sql-editor/sql-editor-lifecycle'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'
import type { Tab } from '@/state/tabs'

/** The snippet id a SQL tab represents. Prefer the metadata; fall back to the id scheme. */
export function getSnippetIdFromTab(tab: Tab): string {
  return tab.metadata?.sqlId ?? tab.id.replace(/^sql-/, '')
}

/**
 * VS Code-style unsaved-changes dot for a SQL snippet tab. Renders only in
 * manual-save mode when the snippet has unsaved edits — in auto mode edits
 * persist on their own, so a dot would just flicker during the debounce.
 *
 * Registered as the SQL tab type's status indicator (see the save coordinator)
 * so the tabs layout can render it without knowing anything about snippets.
 */
export const SqlTabStatusIndicator = ({ tab }: { tab: Tab }) => {
  const snapV2 = useSqlEditorV2StateSnapshot()
  const isManualSaveEnabled = useIsSqlEditorManualSaveEnabled()

  const status = snapV2.snippets[getSnippetIdFromTab(tab)]?.snippet.status
  if (!isManualSaveEnabled || !hasUnsavedChanges(status)) return null

  return (
    <span
      role="img"
      aria-label="Unsaved changes"
      className="block size-2 shrink-0 rounded-full bg-warning"
    />
  )
}
