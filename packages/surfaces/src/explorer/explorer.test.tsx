import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { RunQuery } from '../query/query-model'
import { renderWithTooltip, testCapabilities, TestSqlEditor, testTable } from '../test-utils'
import { Explorer, EXPLORER_QUERY_ID, type ExplorerHandle, type ExplorerProps } from './explorer'

afterEach(cleanup)

const table = testTable()

function setup(props: Partial<ExplorerProps> = {}) {
  const ref = createRef<ExplorerHandle>()
  const onRunQuery = vi.fn<RunQuery>(async (request) => ({
    rows: [{ id: '1', label: 'First' }],
    sql: request.sql,
    hasMore: false,
    offset: 0,
    limit: 50,
    table,
  }))
  renderWithTooltip(
    <Explorer
      ref={ref}
      capabilities={{ ...testCapabilities, readOnly: false, database: true }}
      schema="public"
      onSchemaChange={() => {}}
      schemas={{ status: 'success', data: ['public'] }}
      tables={{ status: 'success', data: [{ name: 'items', rows: 1, rls_enabled: true }] }}
      onRetryNavigation={() => {}}
      onRunQuery={onRunQuery}
      SqlEditor={TestSqlEditor}
      {...props}
    />
  )
  return { ref, onRunQuery }
}

describe('Explorer', () => {
  it('shows a table’s rows beside the sidebar, without SQL or result settings', async () => {
    const { onRunQuery } = setup()
    expect(screen.getByText('Browse your data')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'items' }))

    expect(await screen.findByText('First')).toBeTruthy()
    expect(onRunQuery).toHaveBeenCalledWith(
      expect.objectContaining({ entity: { schema: 'public', name: 'items' } })
    )
    expect(screen.queryByLabelText('SQL')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Result settings' })).toBeNull()
  })

  it('keeps the SQL draft while the user browses tables', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Run SQL' }))
    fireEvent.change(screen.getByLabelText('SQL'), { target: { value: 'select 1' } })

    fireEvent.click(screen.getByRole('button', { name: 'items' }))
    await screen.findByText('First')
    fireEvent.click(screen.getByRole('button', { name: 'Run SQL' }))

    expect(screen.getByLabelText<HTMLTextAreaElement>('SQL').value).toBe('select 1')
  })

  it('opens the agent’s SQL as a draft without running it, but never over the user’s edits', () => {
    const { ref, onRunQuery } = setup()
    act(() => {
      ref.current?.openQuery({ title: 'Slow queries', sql: 'select 1' })
    })
    expect(screen.getByLabelText<HTMLTextAreaElement>('SQL').value).toBe('select 1')
    expect(onRunQuery).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('SQL'), { target: { value: 'select 2' } })
    expect(() => ref.current?.openQuery({ title: 'Other', sql: 'select 3' })).toThrow(
      'unsaved edits'
    )
    expect(ref.current?.editor(EXPLORER_QUERY_ID)?.read().sql).toBe('select 2')
  })

  it('asks before Open query replaces an edited draft', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Run SQL' }))
    fireEvent.change(screen.getByLabelText('SQL'), { target: { value: 'select 1' } })
    fireEvent.click(screen.getByRole('button', { name: 'items' }))
    await screen.findByText('First')

    fireEvent.click(screen.getByRole('button', { name: 'Open query' }))

    expect(screen.getByText('Replace your SQL draft?')).toBeTruthy()
  })
})
