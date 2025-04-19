import { useCallback } from 'react'
import { useParams } from 'common'
import { getTabsStore, updateTabHiddenColumns } from 'state/tabs'

export function useSaveColumnVisibilityToTabs() {
  const { ref: projectRef } = useParams()

  const saveHiddenColumnsToTab = useCallback(
    (hiddenColumnsSet: Set<string>) => {
      if (!projectRef) {
        console.warn('[useSaveColumnVisibilityToTabs] Missing projectRef, cannot save state.')
        return
      }

      // Get the current active tab ID directly within the callback
      // This ensures we use the latest active tab when the save occurs
      const tabsState = getTabsStore(projectRef)
      const activeTabId = tabsState.activeTab

      if (activeTabId) {
        const hiddenColumnsArray = Array.from(hiddenColumnsSet).sort()
        updateTabHiddenColumns(projectRef, activeTabId, hiddenColumnsArray)
      } else {
        console.warn(
          '[useSaveColumnVisibilityToTabs] No active tab found, cannot save hidden columns state.'
        )
      }
    },
    [projectRef] // Dependency on projectRef
  )

  return { saveHiddenColumnsToTab }
}
