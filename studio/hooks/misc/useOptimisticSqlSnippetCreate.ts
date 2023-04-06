import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useProfileQuery } from 'data/profile/profile-query'
import { useCallback } from 'react'
import { useStore } from './useStore'
import { useContentCreateMutation } from 'data/content/content-create-mutation'
import { useParams } from 'common'
import { uuidv4 } from 'lib/helpers'

// [Joshen] Currently not using this after the SQL store refactor to valtio/RQ

export function useOptimisticSqlSnippetCreate(canCreateSQLSnippet: boolean) {
  const { ref } = useParams()
  const { data: profile } = useProfileQuery()
  const { ui, content: contentStore } = useStore()
  const { mutateAsync: createContent } = useContentCreateMutation()

  return useCallback(
    async (args?: Parameters<typeof createSqlSnippetSkeleton>[0]) => {
      // get currently selected tab id in case we need to roll back to it
      // const previouslySelectedTabId = sqlEditorStore.selectedTabId

      if (!ref) return console.error('Project ref is required')

      const snippet = createSqlSnippetSkeleton({
        owner_id: profile?.id,
        ...args,
      })

      // save the snippet in memory in the content store with a client-generated id
      // const { data } = contentStore.createOptimistically(snippet)
      const data = { ...snippet, id: uuidv4() }

      // update the tabs in the sql editor storage to match the content store
      // const tabs = sqlEditorStore.tabsFromContentStore(contentStore, profile?.id)
      // sqlEditorStore.loadTabs(tabs, false)

      // select tab with new snippet
      // sqlEditorStore.selectTab(data.id)

      // save the new query to the server in the background
      if (canCreateSQLSnippet) {
        try {
          await createContent({ projectRef: ref, payload: data })
        } catch (error: any) {
          ui.setNotification({
            category: 'error',
            message: `Failed to create new query: ${error.message}`,
          })
        }
      } else {
        ui.setNotification({
          category: 'info',
          message: 'Your queries will not be saved as you do not have sufficient permissions',
        })
      }
    },
    [profile, contentStore]
  )
}
