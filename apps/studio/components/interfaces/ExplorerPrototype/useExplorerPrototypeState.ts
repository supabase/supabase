/**
 * PROTOTYPE — one hook standing in for what will become several real stores
 * (Explorer tab store, notebook state + save coordinator, per-cell session
 * results). Kept in one place so the data flow is readable end to end.
 */

import { useState } from 'react'

import {
  INITIAL_CHATS,
  INITIAL_NOTEBOOKS,
  INITIAL_RECENT_ITEMS,
  INITIAL_SNIPPETS,
  INITIAL_TABS,
  isWriteQuery,
  runMockQuery,
} from './ExplorerPrototype.mocks'
import type {
  CellResultState,
  ChatSession,
  NotebookCell,
  NotebookContent,
  QueryCellModel,
  RecentItem,
  RunMode,
  SnippetDoc,
  Tab,
  TabResource,
} from './ExplorerPrototype.types'

let idCounter = 0
const nextId = (prefix: string) => `${prefix}-${++idCounter}`

const RECENT_ITEM_LIMIT = 8

/**
 * The rule PR N9 extracts as a pure function so the Assistant enforces the same
 * policy: a cell's own run_mode wins, otherwise the notebook default.
 */
export const resolveEffectiveRunMode = (
  cell: QueryCellModel,
  settings: NotebookContent['settings']
): RunMode => cell.execution?.run_mode ?? settings.run_mode

export const resolveEffectiveRowLimit = (
  cell: QueryCellModel,
  settings: NotebookContent['settings']
): number => cell.execution?.row_limit ?? settings.default_row_limit

export const useExplorerPrototypeState = () => {
  const [tabs, setTabs] = useState<Tab[]>(INITIAL_TABS)
  const [activeTabId, setActiveTabId] = useState<string>(INITIAL_TABS[0].id)
  const [notebooks, setNotebooks] = useState<Record<string, NotebookContent>>(INITIAL_NOTEBOOKS)
  const [snippets, setSnippets] = useState<Record<string, SnippetDoc>>(INITIAL_SNIPPETS)
  const [chats, setChats] = useState<Record<string, ChatSession>>(INITIAL_CHATS)
  const [results, setResults] = useState<Record<string, CellResultState>>({})
  const [dirtyResources, setDirtyResources] = useState<Record<string, boolean>>({})
  const [recentItems, setRecentItems] = useState<RecentItem[]>(INITIAL_RECENT_ITEMS)

  /**
   * Marks a resource dirty *and* bumps it to the top of "Recent". Recents track
   * modification, not navigation — opening a tab deliberately does not touch
   * this, otherwise the list would just mirror whatever you last clicked.
   */
  const markModified = (resource: TabResource) => {
    setDirtyResources((current) => ({ ...current, [resource.id]: true }))
    setRecentItems((current) =>
      [
        { resource, modifiedAt: Date.now() },
        ...current.filter(
          (item) => !(item.resource.type === resource.type && item.resource.id === resource.id)
        ),
      ].slice(0, RECENT_ITEM_LIMIT)
    )
  }

  // -- tabs -----------------------------------------------------------------

  const openTab = (resource: TabResource, title: string) => {
    const existing = tabs.find(
      (tab) => tab.resource.type === resource.type && tab.resource.id === resource.id
    )
    if (existing) {
      setActiveTabId(existing.id)
      return
    }
    const tab: Tab = { id: nextId('tab'), title, resource }
    setTabs((current) => [...current, tab])
    setActiveTabId(tab.id)
  }

  const closeTab = (tabId: string) => {
    setTabs((current) => {
      const remaining = current.filter((tab) => tab.id !== tabId)
      setActiveTabId((active) => {
        if (active !== tabId) return active
        const closedIndex = current.findIndex((tab) => tab.id === tabId)
        const fallback = remaining[closedIndex] ?? remaining[closedIndex - 1] ?? remaining[0]
        return fallback?.id ?? ''
      })
      return remaining
    })
  }

  const reorderTabs = (fromId: string, toId: string) => {
    setTabs((current) => {
      const fromIndex = current.findIndex((tab) => tab.id === fromId)
      const toIndex = current.findIndex((tab) => tab.id === toId)
      if (fromIndex < 0 || toIndex < 0) return current
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  // -- notebooks ------------------------------------------------------------

  const updateNotebook = (
    notebookId: string,
    update: (notebook: NotebookContent) => NotebookContent
  ) => {
    setNotebooks((current) => ({ ...current, [notebookId]: update(current[notebookId]) }))
    markModified({ type: 'notebook', id: notebookId })
  }

  const updateCell = (notebookId: string, cellId: string, next: NotebookCell) =>
    updateNotebook(notebookId, (notebook) => ({
      ...notebook,
      cells: notebook.cells.map((cell) => (cell.id === cellId ? next : cell)),
    }))

  const addCell = (notebookId: string, type: 'query' | 'markdown', afterCellId?: string) => {
    const cell: NotebookCell =
      type === 'markdown'
        ? { id: nextId('cell'), type: 'markdown', markdown: '' }
        : {
            id: nextId('cell'),
            type: 'query',
            name: 'Untitled query',
            query: {
              type: 'inline',
              source: { id: 'database', parameters: { identifier: 'primary' } },
              sql: 'select ',
            },
            display: { type: 'table' },
          }

    updateNotebook(notebookId, (notebook) => {
      const index = afterCellId
        ? notebook.cells.findIndex((existing) => existing.id === afterCellId) + 1
        : notebook.cells.length
      const cells = [...notebook.cells]
      cells.splice(index, 0, cell)
      return { ...notebook, cells }
    })
  }

  const removeCell = (notebookId: string, cellId: string) =>
    updateNotebook(notebookId, (notebook) => ({
      ...notebook,
      cells: notebook.cells.filter((cell) => cell.id !== cellId),
    }))

  const moveCell = (notebookId: string, cellId: string, direction: -1 | 1) =>
    updateNotebook(notebookId, (notebook) => {
      const index = notebook.cells.findIndex((cell) => cell.id === cellId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= notebook.cells.length) return notebook
      const cells = [...notebook.cells]
      const [moved] = cells.splice(index, 1)
      cells.splice(target, 0, moved)
      return { ...notebook, cells }
    })

  const updateNotebookSettings = (notebookId: string, settings: NotebookContent['settings']) =>
    updateNotebook(notebookId, (notebook) => ({ ...notebook, settings }))

  // -- snippets & chat ------------------------------------------------------

  const updateSnippet = (snippetId: string, next: SnippetDoc) => {
    setSnippets((current) => ({ ...current, [snippetId]: next }))
    markModified({ type: 'snippet', id: snippetId })
  }

  const setChatApproval = (chatId: string, messageId: string, approval: 'approved' | 'denied') => {
    setChats((current) => ({
      ...current,
      [chatId]: {
        ...current[chatId],
        messages: current[chatId].messages.map((message) =>
          message.id === messageId && 'approval' in message ? { ...message, approval } : message
        ),
      },
    }))
    // Resolving an approval changes the stored session, so the chat counts as modified.
    markModified({ type: 'chat', id: chatId })
  }

  // -- execution ------------------------------------------------------------

  const runCell = async (cell: QueryCellModel, rowLimit: number) => {
    setResults((current) => ({ ...current, [cell.id]: { status: 'running' } }))

    const outcome = await runMockQuery({
      source: cell.query.source,
      sql: cell.query.sql,
      rowLimit,
    })

    setResults((current) => ({
      ...current,
      [cell.id]:
        outcome.status === 'error'
          ? { status: 'error', message: outcome.message }
          : {
              status: 'success',
              rows: outcome.rows,
              ranAt: new Date().toISOString(),
              rowLimitApplied: rowLimit,
            },
    }))
  }

  /**
   * Notebook "run all" and the on_open pass share this. Write-detected queries
   * never auto-run — they stop the sequence and wait for explicit confirmation.
   */
  const runNotebook = async (notebookId: string) => {
    const notebook = notebooks[notebookId]
    if (!notebook) return

    for (const cell of notebook.cells) {
      if (cell.type !== 'query') continue
      if (isWriteQuery(cell.query.sql)) break
      await runCell(cell, resolveEffectiveRowLimit(cell, notebook.settings))
    }
  }

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    openTab,
    closeTab,
    reorderTabs,
    notebooks,
    updateCell,
    addCell,
    removeCell,
    moveCell,
    updateNotebookSettings,
    snippets,
    updateSnippet,
    chats,
    setChatApproval,
    results,
    recentItems,
    runCell,
    runNotebook,
    dirtyResources,
  }
}

export type ExplorerPrototypeState = ReturnType<typeof useExplorerPrototypeState>
