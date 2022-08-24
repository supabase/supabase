import { createSqlSnippetSkeleton } from 'components/to-be-cleaned/SqlEditor/SqlEditor.utils'
import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import { useCallback } from 'react'
import { useStore } from './useStore'

export function useOptimisticSqlSnippetCreate() {
  const { ui, content: contentStore } = useStore()
  const { profile: user } = ui

  const sqlEditorStore: any = useSqlStore()

  return useCallback(
    async (args?: Parameters<typeof createSqlSnippetSkeleton>[0]) => {
      // get currently selected tab id in case we need to roll back to it
      const previouslySelectedTabId = sqlEditorStore.selectedTabId

      const snippet = createSqlSnippetSkeleton({ owner_id: user?.id, ...args })

      // save the snippet in memory in the content store with a client-generated id
      const { data } = contentStore.createOptimistically(snippet)

      // update the tabs in the sql editor storage to match the content store
      const tabs = sqlEditorStore.tabsFromContentStore(contentStore, user?.id)
      sqlEditorStore.loadTabs(tabs, false)

      // select tab with new snippet
      sqlEditorStore.selectTab(data.id)

      // save the new query to the server in the background
      const { error } = await contentStore.save(data)
      if (error) {
        ui.setNotification({
          category: 'error',
          message: `Failed to create new query: ${error.message}`,
        })
      }
    },
    [user, sqlEditorStore, contentStore]
  )
}
