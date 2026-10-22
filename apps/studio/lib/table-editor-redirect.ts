import { editorEntityTypes } from '@/state/tabs'

type EditorTab = {
  type?: string
  metadata?: { tableId?: number; schema?: string }
}

const tableTabTypes: readonly string[] = editorEntityTypes.table

export function getLastTableRedirect({
  historyEditor,
  openTabs,
  tabsMap,
  explicitSchema,
}: {
  historyEditor?: string
  openTabs: readonly string[]
  tabsMap: Readonly<Record<string, EditorTab | undefined>>
  explicitSchema?: string
}): { tableId: number; schema?: string } | null {
  const lastOpenedTableId = Number(historyEditor)
  const hasHistoryTable = Number.isInteger(lastOpenedTableId)
  const lastTableTabId = openTabs.find((id) => tableTabTypes.includes(tabsMap[id]?.type ?? ''))
  const lastTableTab = lastTableTabId ? tabsMap[lastTableTabId] : undefined
  const lastTabId = lastTableTab?.metadata?.tableId
  // Tabs are keyed by a prefixed id (e.g. "r-293522"), but history only stores
  // the bare table id, so look up the tab by its metadata instead of by key.
  const historyTable = hasHistoryTable
    ? Object.values(tabsMap).find(
        (tab) =>
          tableTabTypes.includes(tab?.type ?? '') && tab?.metadata?.tableId === lastOpenedTableId
      )
    : undefined
  const lastTable = hasHistoryTable
    ? { tableId: lastOpenedTableId, schema: historyTable?.metadata?.schema }
    : { tableId: lastTabId, schema: lastTableTab?.metadata?.schema }

  if (lastTable.tableId === undefined) {
    return null
  }

  return {
    tableId: lastTable.tableId,
    schema: explicitSchema || lastTable.schema,
  }
}
