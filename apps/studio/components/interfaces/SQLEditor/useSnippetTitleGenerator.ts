import { useCallback } from 'react'

import { useSqlTitleGenerateMutation } from '@/data/ai/sql-title-mutation'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

/**
 * Exposes the SQL-title generation mutation plus a fire-and-forget helper that
 * names an untitled snippet from its SQL (updating the store + open tab label).
 */
export function useSnippetTitleGenerator() {
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabs = useTabsStateSnapshot()

  const setAiTitle = useCallback(
    async (id: string, sql: string) => {
      try {
        const { title: name } = await generateSqlTitle({ sql })
        snapV2.updateSnippet({ id, snippet: { name } })
        snapV2.addNeedsSaving(id)
        const tabId = createTabId('sql', { id })
        tabs.updateTab(tabId, { label: name })
      } catch (error) {
        // [Joshen] No error handler required as this happens in the background and not necessary to ping the user
      }
    },
    [generateSqlTitle, snapV2]
  )

  return { generateSqlTitle, setAiTitle }
}
