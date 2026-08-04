import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  INITIAL_CHATS,
  INITIAL_NOTEBOOKS,
  INITIAL_RECENT_ITEMS,
  INITIAL_SNIPPETS,
  isWriteQuery,
  runMockQuery,
} from './ExplorerPrototype.mocks'
import type {
  CellResultState,
  QueryCellModel,
  RecentItem,
  SnippetDoc,
} from './ExplorerPrototype.types'
import { ExplorerSidebar } from './ExplorerSidebar'
import { QueryCell } from './QueryCell'
import { applyCumulative } from './QueryCellDisplay'
import {
  resolveEffectiveRowLimit,
  resolveEffectiveRunMode,
  useExplorerPrototypeState,
} from './useExplorerPrototypeState'
import { ChatView } from './views/ChatView'
import { HomeView } from './views/HomeView'
import { queryCellToSnippet, snippetToQueryCell } from './views/snippetAdapter'
import { customRender, customRenderHook } from '@/tests/lib/custom-render'

describe('snippet adapter', () => {
  const snippet: SnippetDoc = {
    id: 'snip-1',
    name: 'Slowest queries',
    contentType: 'sql',
    sql: 'select 1',
    display: { type: 'table' },
  }

  it('maps a database snippet to a one-cell query model and back unchanged', () => {
    const cell = snippetToQueryCell(snippet)

    expect(cell.type).toBe('query')
    expect(cell.query.type).toBe('inline')
    expect(cell.query.source.id).toBe('database')
    expect(queryCellToSnippet(cell, snippet)).toEqual(snippet)
  })

  it('maps a logs snippet onto the logs source with a default time range', () => {
    const logsSnippet: SnippetDoc = { ...snippet, contentType: 'log_sql' }
    const cell = snippetToQueryCell(logsSnippet)

    expect(cell.query.source.id).toBe('logs')
    expect(queryCellToSnippet(cell, logsSnippet)).toEqual(logsSnippet)
  })

  it('writes the content type back from the chosen source', () => {
    const cell = snippetToQueryCell(snippet)
    const switched: QueryCellModel = {
      ...cell,
      query: {
        ...cell.query,
        source: {
          id: 'logs',
          parameters: { time_range: { type: 'relative', amount: 1, unit: 'hour' } },
        },
      },
    }

    expect(queryCellToSnippet(switched, snippet).contentType).toBe('log_sql')
  })
})

describe('run mode and row limit resolution', () => {
  const settings = { run_mode: 'manual', default_row_limit: 100 } as const
  const cell: QueryCellModel = {
    id: 'cell-1',
    type: 'query',
    name: 'Test',
    query: {
      type: 'inline',
      source: { id: 'database', parameters: {} },
      sql: 'select 1',
    },
    display: { type: 'table' },
  }

  it('falls back to the notebook settings when the cell has no override', () => {
    expect(resolveEffectiveRunMode(cell, settings)).toBe('manual')
    expect(resolveEffectiveRowLimit(cell, settings)).toBe(100)
  })

  it('prefers the cell override', () => {
    const overridden: QueryCellModel = {
      ...cell,
      execution: { run_mode: 'on_open', row_limit: 50 },
    }

    expect(resolveEffectiveRunMode(overridden, settings)).toBe('on_open')
    expect(resolveEffectiveRowLimit(overridden, settings)).toBe(50)
  })
})

describe('query cell results surface', () => {
  it('shows an empty state before the query has been run', () => {
    customRender(
      <QueryCell
        full
        value={{
          id: 'idle-cell',
          type: 'query',
          name: 'Unrun query',
          query: {
            type: 'inline',
            source: { id: 'database', parameters: {} },
            sql: 'select 1',
          },
          display: { type: 'table' },
        }}
        result={{ status: 'idle' }}
        rowLimit={100}
      />
    )

    expect(screen.getByText('Run the query to see results')).toBeInTheDocument()
  })

  it('can hide and restore the SQL editor', async () => {
    const user = userEvent.setup()
    customRender(
      <QueryCell
        value={{
          id: 'toggle-sql-cell',
          type: 'query',
          name: 'Toggle SQL',
          query: {
            type: 'inline',
            source: { id: 'database', parameters: {} },
            sql: 'select 1',
          },
          display: { type: 'table' },
        }}
        result={{ status: 'idle' }}
        rowLimit={100}
      />
    )

    const toggle = screen.getByRole('button', { name: 'Hide SQL' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Show SQL' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('can start with the SQL editor hidden', () => {
    customRender(
      <QueryCell
        defaultSqlVisible={false}
        value={{
          id: 'collapsed-sql-cell',
          type: 'query',
          name: 'Collapsed SQL',
          query: {
            type: 'inline',
            source: { id: 'database', parameters: {} },
            sql: 'select 1',
          },
          display: { type: 'table' },
        }}
        result={{ status: 'idle' }}
        rowLimit={100}
      />
    )

    expect(screen.getByRole('button', { name: 'Show SQL' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })
})

describe('home launch surface', () => {
  it('starts a new chat from the composer', async () => {
    const user = userEvent.setup()
    const onCreateChat = vi.fn()
    customRender(
      <HomeView onCreateNotebook={vi.fn()} onCreateSnippet={vi.fn()} onCreateChat={onCreateChat} />
    )

    await user.type(screen.getByLabelText('Ask about your project'), 'Show recent signup trends')
    await user.click(screen.getByRole('button', { name: 'Start chat' }))

    expect(onCreateChat).toHaveBeenCalledWith('Show recent signup trends')
  })

  it('creates and opens a notebook, snippet, or chat', () => {
    const { result } = customRenderHook(() => useExplorerPrototypeState())

    act(() => result.current.createNotebook())
    expect(
      result.current.tabs.find((tab) => tab.id === result.current.activeTabId)?.resource.type
    ).toBe('notebook')
    const notebookTab = result.current.tabs.find((tab) => tab.id === result.current.activeTabId)
    if (notebookTab?.resource.type === 'notebook') {
      expect(result.current.notebooks[notebookTab.resource.id].cells).toEqual([
        expect.objectContaining({ type: 'markdown', markdown: '' }),
        expect.objectContaining({ type: 'query', name: 'Untitled query' }),
      ])
    }

    act(() => result.current.createSnippet())
    expect(
      result.current.tabs.find((tab) => tab.id === result.current.activeTabId)?.resource.type
    ).toBe('snippet')

    act(() => result.current.createChat('Why did signups drop?'))
    const activeTab = result.current.tabs.find((tab) => tab.id === result.current.activeTabId)
    expect(activeTab?.resource.type).toBe('chat')
    if (activeTab?.resource.type === 'chat') {
      expect(result.current.chats[activeTab.resource.id].messages).toEqual([
        expect.objectContaining({ role: 'user', text: 'Why did signups drop?' }),
      ])
    }
  })
})

describe('assistant notebook creation', () => {
  it('creates and runs a notebook resource when the Assistant proposal is approved', async () => {
    const { result } = customRenderHook(() => useExplorerPrototypeState())
    const message = INITIAL_CHATS['chat-2'].messages.find((entry) => 'notebook' in entry)

    if (!message || !('notebook' in message)) throw new Error('Expected an assistant notebook')

    await act(async () =>
      result.current.createNotebookFromChat(
        'chat-2',
        message.id,
        message.notebook.title,
        message.notebook.content
      )
    )

    const activeTab = result.current.tabs.find((tab) => tab.id === result.current.activeTabId)
    expect(activeTab).toMatchObject({
      title: 'Signup investigation',
      resource: { type: 'notebook' },
    })
    if (activeTab?.resource.type === 'notebook') {
      expect(result.current.notebooks[activeTab.resource.id]).toEqual(message.notebook.content)
    }
    expect(
      result.current.chats['chat-2'].messages.find((entry) => entry.id === message.id)
    ).toMatchObject({ approval: 'approved' })
  })
})

describe('write query detection', () => {
  it.each([
    ['select * from users', false],
    ['  select 1', false],
    ['insert into users values (1)', true],
    ['UPDATE users set name = 1', true],
    ['delete from users', true],
    ['drop table users', true],
  ])('%s → isWrite %s', (sql, expected) => {
    expect(isWriteQuery(sql)).toBe(expected)
  })
})

describe('cumulative display transform', () => {
  it('accumulates each series independently', () => {
    const rows = [
      { day: '1', a: 1, b: 10 },
      { day: '2', a: 2, b: 20 },
      { day: '3', a: 3, b: 30 },
    ]

    expect(applyCumulative(rows, ['a', 'b'])).toEqual([
      { day: '1', a: 1, b: 10 },
      { day: '2', a: 3, b: 30 },
      { day: '3', a: 6, b: 60 },
    ])
  })
})

describe('mock query runner honors the source and row limit', () => {
  it('limits returned rows', async () => {
    const outcome = await runMockQuery({
      source: { id: 'database', parameters: { identifier: 'primary' } },
      sql: 'select id, email from auth.users',
      rowLimit: 5,
    })

    expect(outcome.status).toBe('success')
    if (outcome.status === 'success') expect(outcome.rows).toHaveLength(5)
  })

  it('returns log-shaped rows for the logs source', async () => {
    const outcome = await runMockQuery({
      source: {
        id: 'logs',
        parameters: { time_range: { type: 'relative', amount: 1, unit: 'hour' } },
      },
      sql: 'select timestamp, event_message from logs',
      rowLimit: 3,
    })

    expect(outcome.status).toBe('success')
    if (outcome.status === 'success') {
      expect(Object.keys(outcome.rows[0])).toEqual(['timestamp', 'event_message'])
    }
  })
})

/**
 * The chat surface renders the shared QueryCell read-only, so this also proves
 * the component mounts and the approval-gated run path produces results.
 */
const ChatHarness = ({ chatId = 'chat-1' }: { chatId?: string }) => {
  const [chat, setChat] = useState(INITIAL_CHATS[chatId])
  const [results, setResults] = useState<Record<string, CellResultState>>({})

  const approve = async (messageId: string, cell: QueryCellModel) => {
    setChat((current) => ({
      ...current,
      messages: current.messages.map((message) =>
        message.id === messageId && 'approval' in message
          ? { ...message, approval: 'approved' as const }
          : message
      ),
    }))
    setResults((current) => ({ ...current, [cell.id]: { status: 'running' } }))
    const outcome = await runMockQuery({
      source: cell.query.source,
      sql: cell.query.sql,
      rowLimit: 100,
    })
    setResults((current) => ({
      ...current,
      [cell.id]:
        outcome.status === 'success'
          ? { status: 'success', rows: outcome.rows, ranAt: '', rowLimitApplied: 100 }
          : { status: 'error', message: outcome.message },
    }))
  }

  const deny = (messageId: string) =>
    setChat((current) => ({
      ...current,
      messages: current.messages.map((message) =>
        message.id === messageId && 'approval' in message
          ? { ...message, approval: 'denied' as const }
          : message
      ),
    }))

  const send = (text: string) =>
    setChat((current) => ({
      ...current,
      messages: [
        ...current.messages,
        { id: `sent-${current.messages.length}`, role: 'user', text },
      ],
    }))

  return (
    <ChatView
      chat={chat}
      results={results}
      onApprove={approve}
      onApproveNotebook={() => undefined}
      onDeny={deny}
      onSendMessage={send}
    />
  )
}

describe('agent chat surface', () => {
  it('renders the agent query block with an approval prompt and no editable SQL', async () => {
    customRender(<ChatHarness />)

    expect(await screen.findByText('The Assistant wants to run this query.')).toBeInTheDocument()
    expect(screen.getByText('Signups vs confirmations, last 14 days')).toBeInTheDocument()
    // Read-only surface: the cell name is text, not an input.
    expect(screen.queryByLabelText('Cell name')).not.toBeInTheDocument()
  })

  it('renders an embedded notebook with the same approval treatment', async () => {
    customRender(<ChatHarness chatId="chat-2" />)

    expect((await screen.findAllByText('Signup investigation')).length).toBeGreaterThan(0)
    expect(screen.getByText('OAuth signups by provider')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Hide SQL' })).toHaveLength(2)
    expect(screen.getByText('The Assistant wants to create this notebook.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create and run' })).toBeInTheDocument()
  })

  it('runs the query once approved and reports the row count', async () => {
    const user = userEvent.setup()
    customRender(<ChatHarness />)

    await user.click(await screen.findByRole('button', { name: 'Run query' }))

    await waitFor(() => expect(screen.getByText(/14 rows · limit 100/)).toBeInTheDocument(), {
      timeout: 3000,
    })
    expect(
      screen.getByText(/data sharing is off, so rows are not sent to the Assistant/)
    ).toBeInTheDocument()
  })

  it('does not run the query when skipped', async () => {
    const user = userEvent.setup()
    customRender(<ChatHarness />)

    await user.click((await screen.findAllByRole('button', { name: 'Skip' }))[0])

    expect(await screen.findByText('Skipped — the query was not run.')).toBeInTheDocument()
    expect(screen.queryByText(/rows · limit/)).not.toBeInTheDocument()
  })

  it('sends a message from the chat composer', async () => {
    const user = userEvent.setup()
    customRender(<ChatHarness />)

    await user.type(screen.getByLabelText('Message the Assistant'), 'Compare this to last month')
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    expect(await screen.findByText('Compare this to last month')).toBeInTheDocument()
  })
})

/**
 * Both drill-down levels stay mounted inside the sliding track, so these assert
 * through role queries — the off-screen level is `aria-hidden` and therefore
 * absent from the accessibility tree that `getByRole` searches.
 */
describe('sidebar drill-down', () => {
  const renderSidebar = (onOpen = vi.fn()) => {
    customRender(
      <ExplorerSidebar
        notebooks={INITIAL_NOTEBOOKS}
        snippets={INITIAL_SNIPPETS}
        chats={INITIAL_CHATS}
        recentItems={INITIAL_RECENT_ITEMS}
        onOpen={onOpen}
      />
    )
    return { onOpen }
  }

  const rootPanel = () => within(screen.getByRole('group', { name: 'All resources' }))

  it('shows the three resource types and a mixed recent group at root', () => {
    renderSidebar()
    const root = rootPanel()

    expect(root.getByRole('button', { name: /Snippets/ })).toBeInTheDocument()
    expect(root.getByRole('button', { name: /Notebooks/ })).toBeInTheDocument()
    expect(root.getByRole('button', { name: /Chats/ })).toBeInTheDocument()

    expect(root.getByText('Recent')).toBeInTheDocument()
    // Recent mixes types: a notebook, a chat and a snippet all appear.
    expect(root.getByRole('button', { name: /Authentication health/ })).toBeInTheDocument()
    expect(root.getByRole('button', { name: /Debugging signups/ })).toBeInTheDocument()
    expect(root.getByRole('button', { name: /Slowest queries/ })).toBeInTheDocument()

    // The drilled level exists in the DOM but is out of the a11y tree.
    expect(screen.queryByRole('group', { name: 'Snippets' })).not.toBeInTheDocument()
  })

  it('drills into a type, showing its list with search and a back button', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await user.click(rootPanel().getByRole('button', { name: /Snippets/ }))

    const panel = within(await screen.findByRole('group', { name: 'Snippets' }))
    expect(panel.getByRole('button', { name: 'Back to all resources' })).toBeInTheDocument()
    expect(panel.getByPlaceholderText('Search snippets')).toBeInTheDocument()
    expect(panel.getByRole('button', { name: /Slowest queries/ })).toBeInTheDocument()
    expect(panel.getByRole('button', { name: /Edge errors by hour/ })).toBeInTheDocument()

    // Root is now the hidden level.
    expect(screen.queryByRole('group', { name: 'All resources' })).not.toBeInTheDocument()
  })

  it('filters the drilled list by search', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await user.click(rootPanel().getByRole('button', { name: /Snippets/ }))
    const panel = within(await screen.findByRole('group', { name: 'Snippets' }))
    await user.type(panel.getByPlaceholderText('Search snippets'), 'edge')

    await waitFor(() =>
      expect(panel.queryByRole('button', { name: /Slowest queries/ })).not.toBeInTheDocument()
    )
    expect(panel.getByRole('button', { name: /Edge errors by hour/ })).toBeInTheDocument()
  })

  it('reports when a search matches nothing', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await user.click(rootPanel().getByRole('button', { name: /Notebooks/ }))
    const panel = within(await screen.findByRole('group', { name: 'Notebooks' }))
    await user.type(panel.getByPlaceholderText('Search notebooks'), 'zzz')

    expect(await panel.findByText(/No notebooks match "zzz"/)).toBeInTheDocument()
  })

  it('returns to root via the back button and clears the search', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await user.click(rootPanel().getByRole('button', { name: /Chats/ }))
    const panel = within(await screen.findByRole('group', { name: 'Chats' }))
    await user.type(panel.getByPlaceholderText('Search chats'), 'debug')
    await user.click(panel.getByRole('button', { name: 'Back to all resources' }))

    expect(await screen.findByRole('group', { name: 'All resources' })).toBeInTheDocument()

    // Re-entering starts with an empty search, not the previous term.
    await user.click(rootPanel().getByRole('button', { name: /Chats/ }))
    const reopened = within(await screen.findByRole('group', { name: 'Chats' }))
    expect(reopened.getByPlaceholderText('Search chats')).toHaveValue('')
  })

  it('opens the chosen resource with its type and id', async () => {
    const user = userEvent.setup()
    const { onOpen } = renderSidebar()

    await user.click(rootPanel().getByRole('button', { name: /Notebooks/ }))
    const panel = within(await screen.findByRole('group', { name: 'Notebooks' }))
    await user.click(panel.getByRole('button', { name: /Authentication health/ }))

    expect(onOpen).toHaveBeenCalledWith(
      { type: 'notebook', id: 'nb-auth-health' },
      'Authentication health'
    )
  })
})

describe('recent items track modification, not navigation', () => {
  it('does not reorder when a tab is merely opened', () => {
    const { result } = customRenderHook(() => useExplorerPrototypeState())
    const before = result.current.recentItems

    act(() => result.current.openTab({ type: 'snippet', id: 'snip-edge-errors' }, 'Edge errors'))

    expect(result.current.recentItems).toEqual(before)
  })

  it('moves a resource to the top when it is edited', () => {
    const { result } = customRenderHook(() => useExplorerPrototypeState())
    expect(result.current.recentItems[0].resource.id).not.toBe('snip-edge-errors')

    act(() =>
      result.current.updateSnippet('snip-edge-errors', {
        ...INITIAL_SNIPPETS['snip-edge-errors'],
        sql: 'select 1',
      })
    )

    expect(result.current.recentItems[0].resource).toEqual({
      type: 'snippet',
      id: 'snip-edge-errors',
    })
  })

  it('does not duplicate a resource that is edited twice', () => {
    const { result } = customRenderHook(() => useExplorerPrototypeState())
    const notebookId = 'nb-auth-health'

    act(() => result.current.addCell(notebookId, 'markdown'))
    act(() => result.current.addCell(notebookId, 'markdown'))

    const matching = (result.current.recentItems as RecentItem[]).filter(
      (item) => item.resource.id === notebookId && item.resource.type === 'notebook'
    )
    expect(matching).toHaveLength(1)
    expect(result.current.recentItems[0].resource.id).toBe(notebookId)
  })
})

describe('notebook cell reordering', () => {
  it('moves a dragged cell before its drop target', () => {
    const { result } = customRenderHook(() => useExplorerPrototypeState())

    act(() =>
      result.current.moveCellTo('nb-auth-health', 'cell-active-users', 'cell-signups', 'before')
    )

    expect(result.current.notebooks['nb-auth-health'].cells.map((cell) => cell.id)).toEqual([
      'cell-heading',
      'cell-signups-context',
      'cell-active-users',
      'cell-signups',
      'cell-auth-errors-context',
      'cell-auth-errors',
      'cell-active-users-context',
    ])
  })
})
