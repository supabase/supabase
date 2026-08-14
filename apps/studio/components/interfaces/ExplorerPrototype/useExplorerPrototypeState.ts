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
  const [activeTabId, setActiveTabId] = useState<string>('home')
  const [queries, setQueries] = useState<Record<string, QueryCellModel>>({})
  const [notebooks, setNotebooks] = useState<Record<string, NotebookContent>>(INITIAL_NOTEBOOKS)
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
      const closedTab = current.find((tab) => tab.id === tabId)
      const remaining = current.filter((tab) => tab.id !== tabId)
      if (closedTab?.resource.type === 'query') {
        setQueries(({ [closedTab.resource.id]: _, ...next }) => next)
        setResults(({ [closedTab.resource.id]: _, ...next }) => next)
        setDirtyResources(({ [closedTab.resource.id]: _, ...next }) => next)
      }
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

  const moveCellTo = (
    notebookId: string,
    cellId: string,
    targetCellId: string,
    placement: 'before' | 'after'
  ) =>
    updateNotebook(notebookId, (notebook) => {
      if (cellId === targetCellId) return notebook

      const cells = [...notebook.cells]
      const sourceIndex = cells.findIndex((cell) => cell.id === cellId)
      if (sourceIndex < 0) return notebook

      const [moved] = cells.splice(sourceIndex, 1)
      const targetIndex = cells.findIndex((cell) => cell.id === targetCellId)
      if (targetIndex < 0) return notebook

      cells.splice(targetIndex + (placement === 'after' ? 1 : 0), 0, moved)
      return { ...notebook, cells }
    })

  const updateNotebookSettings = (notebookId: string, settings: NotebookContent['settings']) =>
    updateNotebook(notebookId, (notebook) => ({ ...notebook, settings }))

  // -- resource creation ----------------------------------------------------

  /**
   * Ad-hoc queries have no document or sidebar entry. Closing their tab drops
   * the query and its local result state.
   */
  const createQuery = () => {
    const id = nextId('query')
    const resource: TabResource = { type: 'query', id }
    setQueries((current) => ({
      ...current,
      [id]: {
        id,
        type: 'query',
        name: 'Untitled query',
        query: {
          type: 'inline',
          source: { id: 'database', parameters: { identifier: 'primary' } },
          sql: 'select ',
        },
        display: { type: 'table' },
      },
    }))
    setDirtyResources((current) => ({ ...current, [id]: true }))
    openTab(resource, 'Untitled query')
  }

  const updateQuery = (queryId: string, next: QueryCellModel) => {
    setQueries((current) => ({ ...current, [queryId]: next }))
    setDirtyResources((current) => ({ ...current, [queryId]: true }))
  }

  const addQueryToNotebook = (query: QueryCellModel, notebookId: string) =>
    updateNotebook(notebookId, (notebook) => ({
      ...notebook,
      cells: [...notebook.cells, { ...query, id: nextId('cell') }],
    }))

  const createNotebook = () => {
    const id = nextId('notebook')
    const resource: TabResource = { type: 'notebook', id }
    setNotebooks((current) => ({
      ...current,
      [id]: {
        schema_version: 1,
        settings: { run_mode: 'manual', default_row_limit: 100 },
        cells: [
          {
            id: nextId('cell'),
            type: 'markdown',
            markdown: '# Untitled notebook\n\nAdd context, notes, and observations here.',
          },
          {
            id: nextId('cell'),
            type: 'query',
            name: 'Untitled query',
            query: {
              type: 'inline',
              source: { id: 'database', parameters: { identifier: 'primary' } },
              sql: '',
            },
            display: { type: 'table' },
          },
        ],
      },
    }))
    markModified(resource)
    openTab(resource, 'Untitled notebook')
  }

  const createChat = (prompt?: string) => {
    const text = prompt?.trim() ?? ''

    const id = nextId('chat')
    const resource: TabResource = { type: 'chat', id }
    const title = text.length > 0 ? text.slice(0, 48) : 'New chat'
    setChats((current) => ({
      ...current,
      [id]: {
        id,
        name: title,
        messages: text.length > 0 ? [{ id: nextId('message'), role: 'user', text }] : [],
      },
    }))
    markModified(resource)
    openTab(resource, title)
  }

  const explainQuery = (query: QueryCellModel) =>
    createChat(
      `Explain the following SQL query and suggest any improvements.\n\n\`\`\`sql\n${query.query.sql}\n\`\`\``
    )

  const analyseNotebook = (title: string) =>
    createChat(`Run the notebook "${title}" and analyse the results.`)

  // -- chat -----------------------------------------------------------------

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

  const sendChatMessage = (chatId: string, text: string) => {
    const message = text.trim()
    if (message.length === 0) return

    setChats((current) => ({
      ...current,
      [chatId]: {
        ...current[chatId],
        messages: [
          ...current[chatId].messages,
          { id: nextId('message'), role: 'user', text: message },
        ],
      },
    }))
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

  const createNotebookFromChat = (
    chatId: string,
    messageId: string,
    title: string,
    notebook: NotebookContent
  ) => {
    const id = nextId('notebook')
    const resource: TabResource = { type: 'notebook', id }

    setNotebooks((current) => ({ ...current, [id]: notebook }))
    setChatApproval(chatId, messageId, 'approved')
    markModified(resource)
    openTab(resource, title)
  }

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    openTab,
    closeTab,
    reorderTabs,
    queries,
    createQuery,
    updateQuery,
    addQueryToNotebook,
    notebooks,
    updateCell,
    addCell,
    removeCell,
    moveCell,
    moveCellTo,
    updateNotebookSettings,
    createNotebook,
    chats,
    createChat,
    explainQuery,
    analyseNotebook,
    sendChatMessage,
    setChatApproval,
    createNotebookFromChat,
    results,
    recentItems,
    runCell,
    runNotebook,
    dirtyResources,
  }
}

export type ExplorerPrototypeState = ReturnType<typeof useExplorerPrototypeState>
