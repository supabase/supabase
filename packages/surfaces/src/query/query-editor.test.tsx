import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SaveRow } from '../row/row-editor'
import { renderWithTooltip, TestSqlEditor, testTable } from '../test-utils'
import { QueryEditor, type QueryEditorHandle, type QueryEditorProps } from './query-editor'
import { tableSql, type QueryResult, type RunQuery } from './query-model'

// Globals are off in this package, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const entity = { schema: 'public', name: 'items' }
const table = testTable()
const rows = [{ id: '1', label: 'First' }]

const resultFor = (sql: string, extra: Partial<QueryResult> = {}): QueryResult => ({
  rows,
  sql,
  hasMore: false,
  offset: 0,
  limit: 50,
  ...extra,
})

/** Resolves table reads with verified metadata, like the host's table transport. */
const tableRun = () => vi.fn<RunQuery>(async (request) => resultFor(request.sql, { table }))

function renderEditor(props: Partial<QueryEditorProps> = {}) {
  const ref = createRef<QueryEditorHandle>()
  const onDirtyChange = vi.fn()
  const onRun = vi.fn<RunQuery>(() => Promise.reject(new Error('Unexpected run in this test')))
  const onSaveRow = vi.fn<SaveRow>()
  renderWithTooltip(
    <QueryEditor
      ref={ref}
      onRun={onRun}
      onSaveRow={onSaveRow}
      SqlEditor={TestSqlEditor}
      readOnly={false}
      title="items"
      initialSql={tableSql(entity)}
      entity={entity}
      onDirtyChange={onDirtyChange}
      {...props}
    />
  )
  return { ref, onDirtyChange }
}

describe('QueryEditor', () => {
  it('runs an untouched table query on open and lets the user edit its rows', async () => {
    const onRun = tableRun()
    renderEditor({ onRun })

    expect(await screen.findByRole('button', { name: 'Edit row 1' })).toBeTruthy()
    expect(onRun).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Insert row' })).toBeTruthy()
  })

  it('asks the host to run with the tab’s table and page size, so it can use the exact table read', async () => {
    const onRun = tableRun()
    renderEditor({ onRun })

    await waitFor(() => expect(onRun).toHaveBeenCalled())
    expect(onRun).toHaveBeenCalledWith({
      sql: tableSql(entity),
      entity,
      offset: 0,
      limit: 50,
      source: 'database',
    })
  })

  it('shows table results read-only when the host cannot save rows', async () => {
    renderEditor({ onRun: tableRun(), onSaveRow: undefined })

    expect(await screen.findByText('First')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Edit row 1' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Insert row' })).toBeNull()
  })

  it('never runs a custom draft on open, and shows its results read-only after Run', async () => {
    const onRun = vi.fn<RunQuery>(async (request) => resultFor(request.sql))
    renderEditor({ initialSql: 'select id, label from items', entity: undefined, onRun })

    expect(onRun).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    expect(await screen.findByText('First')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Edit row 1' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Insert row' })).toBeNull()
  })

  it('shows launch results without running the query again', () => {
    const sql = 'select id from items'
    const onRun = vi.fn<RunQuery>()
    renderEditor({
      onRun,
      initialSql: sql,
      entity: undefined,
      initialResult: resultFor(sql, { rows: [{ id: 'launched' }], limit: 1000 }),
    })
    expect(screen.getByText('launched')).toBeTruthy()
    expect(onRun).not.toHaveBeenCalled()
  })

  it('marks results as stale once the SQL changes, until the user runs it', async () => {
    const sql = 'select id, label from items'
    const { onDirtyChange } = renderEditor({
      initialSql: sql,
      entity: undefined,
      onRun: tableRun(),
      initialResult: resultFor(sql, { table }),
    })
    await screen.findByText('First')

    fireEvent.change(screen.getByLabelText('SQL'), { target: { value: 'select 1' } })

    expect(
      screen.getByText('Showing previous results. Run your query to update them.')
    ).toBeTruthy()
    expect(onDirtyChange).toHaveBeenLastCalledWith(true)
    // Stale rows must not stay editable under different SQL.
    expect(screen.queryByRole('button', { name: 'Edit row 1' })).toBeNull()
  })

  it('keeps a table tab a table: no SQL to edit, and Open query copies its SQL to a new query', async () => {
    const onOpenQuery = vi.fn()
    const { ref } = renderEditor({ onRun: tableRun(), onOpenQuery })
    await screen.findByText('First')

    expect(screen.queryByLabelText('SQL')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Run' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Open query' }))
    expect(onOpenQuery).toHaveBeenCalledWith({ title: 'items query', sql: tableSql(entity) })
    // An agent cannot rewrite a table tab into custom SQL either.
    expect(() => ref.current?.update('delete from items', 0)).toThrow('no editable SQL')
  })

  it('rejects agent edits based on an old revision and never reruns custom SQL on refresh', () => {
    const onRun = vi.fn<RunQuery>()
    const { ref } = renderEditor({ initialSql: 'select 1', entity: undefined, onRun })
    const handle = ref.current
    if (!handle) throw new Error('Editor handle missing')

    act(() => {
      handle.update('select 2', 0)
    })
    expect(handle.read()).toMatchObject({ sql: 'select 2', revision: 1 })
    expect(() => handle.update('drop table users', 0)).toThrow('query changed')
    expect(handle.refresh()).toBe(false)
    expect(onRun).not.toHaveBeenCalled()
  })

  it('shows query errors and keeps the draft', async () => {
    const onRun = vi.fn<RunQuery>().mockRejectedValue(new Error('syntax error at "selec"'))
    renderEditor({ initialSql: 'selec 1', entity: undefined, onRun })

    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('syntax error'))
    expect(screen.getByLabelText<HTMLTextAreaElement>('SQL').value).toBe('selec 1')
  })
})
