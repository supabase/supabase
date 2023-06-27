import { xor } from 'lodash'
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

export interface TabGroup {
  tabIds: string[]
  activeId: string
}

interface TabsContextValue {
  tabGroups: TabGroup[]
  setTabGroups: Dispatch<SetStateAction<TabGroup[]>>
}

const TabsContext = createContext<TabsContextValue>({
  tabGroups: [],
  setTabGroups: () => {},
})

/**
 * Tracks active Tab IDs across the site so that tabs
 * with the same ID stay in sync (eg. JS vs TS tabs).
 */
const TabsProvider = ({ children }: PropsWithChildren<{}>) => {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([])

  return <TabsContext.Provider value={{ tabGroups, setTabGroups }}>{children}</TabsContext.Provider>
}

export interface UseTabGroupValue {
  /**
   * The active tab ID for the tab group.
   * This value is shared with all matching tab
   * groups within the context.
   */
  groupActiveId?: string

  /**
   * Set the active tab ID for the tab group.
   * Value will be shared with all matching tab
   * groups within the context.
   */
  setGroupActiveId?(id: string): void
}

/**
 * Hook to retrieve and set the active tab ID for
 * the current tab group.
 * The value will be shared with all matching tab
 * groups within the context.
 *
 * Silently fails if no `TabsProvider` is set.
 */
export const useTabGroup = (tabIds: string[]): UseTabGroupValue => {
  const tabsContext = useContext(TabsContext)

  if (!tabsContext) {
    return {}
  }

  const { tabGroups, setTabGroups } = tabsContext

  const groupActiveId = useMemo(
    () => tabGroups.find((group) => xor(group.tabIds, tabIds).length === 0)?.activeId,
    [tabGroups]
  )

  const setGroupActiveId = useCallback((id: string) => {
    setTabGroups((groups) => {
      // Clone the array
      const newGroups = groups.concat()

      const existingGroupIndex = groups.findIndex((group) => xor(group.tabIds, tabIds).length === 0)

      const tabGroup: TabGroup = {
        tabIds,
        activeId: id,
      }

      // If this group already exists, replace it
      // Otherwise add to the end
      if (existingGroupIndex !== -1) {
        newGroups.splice(existingGroupIndex, 1, tabGroup)
      } else {
        newGroups.push(tabGroup)
      }

      return newGroups
    })
  }, [])

  return { groupActiveId, setGroupActiveId }
}

export default TabsProvider
