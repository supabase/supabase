import { Entity } from 'data/entity-types/entity-types-infinite-query'
import useLatest from 'hooks/misc/useLatest'
import { useCallback, useEffect, useRef } from 'react'
import { createTabId, editorEntityTypes, useTabsStateSnapshot } from 'state/tabs'

export function useTableEditorTabsCleanUp() {
  const tabs = useTabsStateSnapshot()
  const tabMapRef = useLatest(tabs.tabsMap)
  const recentItemsRef = useLatest(tabs.recentItems)
  const openTabsRef = useLatest(tabs.openTabs)

  return useCallback(({ schemas, entities }: { schemas: string[]; entities: Entity[] }) => {
    // Identity all entities by tab ID
    const entitiesById: string[] = entities.map((x: Entity) => createTabId(x.type, { id: x.id }))

    const recentItemsFilteredToSchemas: string[] = []
    for (const schema of schemas) {
      recentItemsFilteredToSchemas.push(
        ...recentItemsRef.current.filter((x) => x.metadata?.schema === schema).map((x) => x.id)
      )
    }

    const recentItemsToRemove = [
      ...recentItemsFilteredToSchemas.filter((entityId) => !entitiesById.includes(entityId)),
    ]

    tabs.removeRecentItems(recentItemsToRemove)

    const tabsFilteredToSchemas: string[] = []
    for (const schema of schemas) {
      tabsFilteredToSchemas.push(
        ...openTabsRef.current.filter((tabId) => {
          const tab = tabMapRef.current[tabId]
          return tab?.metadata?.schema === schema
        })
      )
    }

    const tableEditorTabsToBeCleaned = [
      ...tabsFilteredToSchemas.filter(
        (id) => !id.startsWith('sql') && !id.startsWith('schema') && !entitiesById.includes(id)
      ),
    ]

    // perform tabs cleanup
    tabs.removeTabs(tableEditorTabsToBeCleaned)

    // [Joshen] Validate for opened tabs, if their label matches the entity's name - update label if not
    // As the entity could've been renamed outside of the table editor
    // e.g Using the SQL editor to rename the entity
    const openTabs = openTabsRef.current
      .map((id) => tabMapRef.current[id])
      .filter((tab) => !!tab && editorEntityTypes['table']?.includes(tab.type))

    openTabs.forEach((tab) => {
      const entity = entities?.find((x) => tab.metadata?.tableId === x.id)
      if (!!entity && entity.name !== tab.label) tabs.updateTab(tab.id, { label: entity.name })
    })
  }, [])
}

export function useSqlEditorTabsCleanup() {
  const tabs = useTabsStateSnapshot()
  const tabMapRef = useLatest(tabs.tabsMap)
  const openTabsRef = useLatest(tabs.openTabs)

  return useCallback(({ snippets }: { snippets: { id: string; type: string; name: string }[] }) => {
    // these are tabs that are static content
    // these canot be removed from localstorage based on this query request
    const IGNORED_TAB_IDS = ['sql-templates', 'sql-quickstarts']

    // Identify all SQL snippets / content by their tab ids
    const currentContentIds = [
      ...snippets
        .filter((content) => content.type === 'sql')
        .map((content) => createTabId('sql', { id: content.id })),
      // append ignored tab IDs
      ...IGNORED_TAB_IDS,
    ]

    // Remove any snippet tabs that might no longer be existing (removed outside of the dashboard session)
    const snippetTabsToBeCleaned = openTabsRef.current.filter(
      (id: string) => id.startsWith('sql') && !currentContentIds.includes(id)
    )
    tabs.removeTabs(snippetTabsToBeCleaned)

    // Remove any recent items that might no longer be existing (removed outside of the dashboard session)
    const recentItems = tabs.getRecentItemsByType('sql')
    tabs.removeRecentItems(
      recentItems
        ? recentItems.filter((item) => !currentContentIds.includes(item.id)).map((item) => item.id)
        : []
    )

    // [Joshen] Validate for opened tabs, if their label matches the snippet's name - update label if not
    // As the snippets name could've been updated outside of the SQL Editor session
    // e.g for a shared snippet, the owner could've updated the name of the snippet
    const openSqlTabs = openTabsRef.current
      .map((id) => tabMapRef.current[id])
      .filter((tab) => !!tab && editorEntityTypes['sql']?.includes(tab.type))

    openSqlTabs.forEach((tab) => {
      const snippet = snippets?.find((x) => tab.metadata?.sqlId === x.id)
      if (!!snippet && snippet.name !== tab.label) tabs.updateTab(tab.id, { label: snippet.name })
    })
  }, [])
}

interface UseTabsScrollOptions {
  activeTab: string | null | undefined
  tabCount: number
}

export function useTabsScroll({ activeTab, tabCount }: UseTabsScrollOptions) {
  const tabsListRef = useRef<HTMLDivElement>(null)
  const prevTabCountRef = useRef<number>(tabCount)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollLeft = tabsListRef.current.scrollWidth
    }
  }, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (!tabsListRef.current) return

    const tabCountIncreased = tabCount > prevTabCountRef.current

    if (tabCountIncreased) {
      tabsListRef.current.scrollLeft = tabsListRef.current.scrollWidth
    } else if (activeTab) {
      const activeTabElement = tabsListRef.current.querySelector(
        `[data-state="active"]`
      ) as HTMLElement

      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        })
      }
    }

    prevTabCountRef.current = tabCount
  }, [activeTab, tabCount])

  return { tabsListRef }
}
