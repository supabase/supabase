import { Entity } from 'data/entity-types/entity-types-infinite-query'
import {
  getRecentItemsByType,
  getRecentItemsStore,
  RecentItem,
  removeRecentItems,
} from 'state/recent-items'
import { createTabId, editorEntityTypes, getTabsStore, removeTabs, updateTab } from 'state/tabs'

export const tableEditorTabsCleanUp = ({
  ref,
  schemas,
  entities,
}: {
  ref: string
  schemas: string[]
  entities: Entity[]
}) => {
  // Identity all entities by tab ID
  const entitiesById: string[] = entities.map((x: Entity) => createTabId(x.type, { id: x.id }))

  // Remove any recent items that no longer exists in the database
  const recentItemsStore = getRecentItemsStore(ref)

  const recentItemsFilteredToSchemas: string[] = []
  for (const schema of schemas) {
    recentItemsFilteredToSchemas.push(
      ...recentItemsStore?.items
        ?.filter((x: RecentItem) => x.metadata?.schema === schema)
        .map((x) => x.id)
    )
  }

  const recentItemsToRemove = [
    ...recentItemsFilteredToSchemas.filter((entityId) => !entitiesById.includes(entityId)),
  ]

  removeRecentItems(ref, recentItemsToRemove)

  // Close any tabs which might have been opened but no longer exists in the database
  const tabsStore = getTabsStore(ref)

  const tabsFilteredToSchemas: string[] = []
  for (const schema of schemas) {
    tabsFilteredToSchemas.push(
      ...tabsStore?.openTabs?.filter((tabId) => {
        const tab = tabsStore.tabsMap[tabId]
        return tab.metadata?.schema === schema
      })
    )
  }

  const tableEditorTabsToBeCleaned = [
    ...tabsFilteredToSchemas.filter(
      (id) => !id.startsWith('sql') && !id.startsWith('schema') && !entitiesById.includes(id)
    ),
  ]

  // perform tabs cleanup
  removeTabs(ref, tableEditorTabsToBeCleaned)

  // [Joshen] Validate for opened tabs, if their label matches the entity's name - update label if not
  // As the entity could've been renamed outside of the table editor
  // e.g Using the SQL editor to rename the entity
  const openTabs = tabsStore.openTabs
    .map((id) => tabsStore.tabsMap[id])
    .filter((tab) => editorEntityTypes['table']?.includes(tab.type))

  openTabs.forEach((tab) => {
    const entity = entities?.find((x) => tab.metadata?.tableId === x.id)
    if (!!entity && entity.name !== tab.label) updateTab(ref, tab.id, { label: entity.name })
  })
}

export const sqlEditorTabsCleanup = ({
  ref,
  snippets,
}: {
  ref: string
  snippets: { id: string; type: string; name: string }[]
}) => {
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
  const tabsStore = getTabsStore(ref)
  const snippetTabsToBeCleaned = tabsStore.openTabs.filter(
    (id: string) => id.startsWith('sql') && !currentContentIds.includes(id)
  )
  removeTabs(ref, snippetTabsToBeCleaned)

  // Remove any recent items that might no longer be existing (removed outside of the dashboard session)
  const recentItems = getRecentItemsByType(ref, 'sql')
  removeRecentItems(
    ref,
    recentItems
      ? recentItems.filter((item) => !currentContentIds.includes(item.id)).map((item) => item.id)
      : []
  )

  // [Joshen] Validate for opened tabs, if their label matches the snippet's name - update label if not
  // As the snippets name could've been updated outside of the SQL Editor session
  // e.g for a shared snippet, the owner could've updated the name of the snippet
  const openSqlTabs = tabsStore.openTabs
    .map((id) => tabsStore.tabsMap[id])
    .filter((tab) => editorEntityTypes['sql']?.includes(tab.type))

  openSqlTabs.forEach((tab) => {
    const snippet = snippets?.find((x) => tab.metadata?.sqlId === x.id)
    if (!!snippet && snippet.name !== tab.label) updateTab(ref, tab.id, { label: snippet.name })
  })
}
