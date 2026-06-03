import { useCallback, useEffect, useRef } from 'react'

import { Entity } from '@/data/entity-types/entity-types-infinite-query'
import useLatest from '@/hooks/misc/useLatest'
import { createTabId, editorEntityTypes, isSqlEditorTab, useTabsStateSnapshot } from '@/state/tabs'

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
        (id) =>
          !isSqlEditorTab(id, tabMapRef.current) &&
          !id.startsWith('schema') &&
          !entitiesById.includes(id)
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

  return useCallback(
    ({
      snippets,
      notebooks = [],
      chats = [],
    }: {
      snippets: { id: string; type: string; name: string }[]
      notebooks?: { id: string; name: string }[]
      chats?: { id: string; name: string }[]
    }) => {
      // These lists are paginated and some sections are fetched only when expanded.
      // They can refresh labels, but absence is not proof that content was deleted.
      const openSqlEditorTabs = openTabsRef.current
        .map((id) => tabMapRef.current[id])
        .filter((tab) => !!tab && isSqlEditorTab(tab))

      openSqlEditorTabs.forEach((tab) => {
        if (tab.type === 'sql') {
          const snippet = snippets?.find((x) => tab.metadata?.sqlId === x.id)
          if (!!snippet && snippet.name !== tab.label)
            tabs.updateTab(tab.id, { label: snippet.name })
        }

        if (tab.type === 'notebook') {
          const notebook = notebooks?.find((x) => tab.metadata?.notebookId === x.id)
          if (!!notebook && notebook.name !== tab.label)
            tabs.updateTab(tab.id, { label: notebook.name })
        }

        if (tab.type === 'chat') {
          const chat = chats?.find((x) => tab.metadata?.chatId === x.id)
          if (!!chat && chat.name !== tab.label) tabs.updateTab(tab.id, { label: chat.name })
        }
      })
    },
    []
  )
}

interface UseTabsScrollOptions {
  activeTab: string | null | undefined
  tabCount: number
  enabled?: boolean
}

export function useTabsScroll({ activeTab, tabCount, enabled = true }: UseTabsScrollOptions) {
  const tabsListRef = useRef<HTMLDivElement>(null)
  const prevTabCountRef = useRef<number>(tabCount)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (!enabled || !tabsListRef.current) return
    tabsListRef.current.scrollLeft = tabsListRef.current.scrollWidth
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

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
  }, [activeTab, enabled, tabCount])

  return { tabsListRef }
}
