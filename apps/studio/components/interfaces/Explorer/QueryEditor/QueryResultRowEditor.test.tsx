import type { PGTable } from '@supabase/pg-meta'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { QueryResultRowEditor } from './QueryResultRowEditor'
import type { PendingCellEdit } from '@/lib/query-result-editing'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// Monaco and the foreign-row browser have separate coverage. Keep the real row form and
// network requests for these queue/discard integration tests.
vi.mock('@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/TextEditor', () => ({
  TextEditor: () => null,
}))
vi.mock('@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/JsonEditor', () => ({
  JsonEditor: () => null,
}))
vi.mock(
  '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/ForeignRowSelector/ForeignRowSelector',
  () => ({ ForeignRowSelector: () => null })
)
mockAnimationsApi()

const table: PGTable = {
  id: 42,
  schema: 'public',
  name: 'items',
  rls_enabled: false,
  rls_forced: false,
  replica_identity: 'DEFAULT',
  bytes: 0,
  size: '0',
  live_rows_estimate: 1,
  dead_rows_estimate: 0,
  comment: null,
  relationships: [],
  primary_keys: [{ table_id: 42, schema: 'public', table_name: 'items', name: 'id' }],
  columns: ['id', 'name', 'hidden'].map((name, index) => ({
    id: `42.${index + 1}`,
    table_id: 42,
    schema: 'public',
    table: 'items',
    name,
    ordinal_position: index + 1,
    data_type: 'text',
    format: 'text',
    is_identity: false,
    identity_generation: null,
    is_generated: false,
    is_nullable: false,
    is_updatable: true,
    is_unique: name === 'id',
    check: null,
    default_value: null,
    enums: [],
    comment: null,
  })),
}
const originalRow = { id: 'original-id', name: 'Original', hidden: 'Not in query projection' }

beforeEach(() => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      id: 1,
      ref: 'default',
      organization_id: 1,
      name: 'Test Project',
      status: 'ACTIVE_HEALTHY',
      cloud_provider: 'AWS',
      region: 'us-east-1',
      db_host: 'db.default.supabase.co',
      restUrl: 'https://default.supabase.co/rest/v1/',
      inserted_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      subscription_id: 'sub_123',
      is_branch_enabled: false,
      is_physical_backups_enabled: false,
      high_availability: false,
      integration_source: null,
      connectionString: 'postgresql://postgres@localhost:5432/postgres',
      is_hibernating: false,
    },
  })
})

function mockRows({
  missing = false,
  waitForRow,
}: {
  missing?: boolean
  waitForRow?: Promise<void>
} = {}) {
  const writes: string[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const { query } = z.object({ query: z.string() }).parse(await request.json())
      if (/select\s+\*/i.test(query)) {
        await waitForRow
        return HttpResponse.json<Record<string, unknown>[]>(missing ? [] : [originalRow])
      }
      if (/\b(insert|update|delete)\b/i.test(query)) writes.push(query)
      return HttpResponse.json<Record<string, unknown>[]>([])
    },
  })
  return writes
}

function renderEditor({ pendingEdits = [] }: { pendingEdits?: PendingCellEdit[] } = {}) {
  const onStage = vi.fn()
  const onClose = vi.fn()
  const view = customRender(
    <QueryResultRowEditor
      projectRef="default"
      table={table}
      identifiers={{ id: originalRow.id }}
      pendingEdits={pendingEdits}
      onClose={onClose}
      onStage={onStage}
      roleImpersonationState={{ role: { type: 'custom', role: 'query_role' }, claims: undefined }}
    />
  )
  return { ...view, onStage, onClose }
}

describe('query result row editing', () => {
  it('keeps the same sheet mounted while replacing the padded loader with the row form', async () => {
    let releaseRow = () => {}
    const waitForRow = new Promise<void>((resolve) => {
      releaseRow = resolve
    })
    mockRows({ waitForRow })
    renderEditor()

    const sheet = await screen.findByTestId('side-panel-row-editor')
    const loading = screen.getByRole('status', { name: 'Loading row' })
    expect(loading.parentElement).toHaveClass('px-4', 'sm:px-6', 'py-4', 'sm:py-6')
    expect(screen.queryByRole('button', { name: 'Queue changes' })).not.toBeInTheDocument()

    releaseRow()
    expect(await screen.findByTestId('name-input')).toHaveValue(originalRow.name)
    expect(screen.getByTestId('side-panel-row-editor')).toBe(sheet)
    expect(screen.queryByRole('status', { name: 'Loading row' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Queue changes' })).toBeEnabled()
  })

  // Changes join the result's other pending edits and are written together on Save, so
  // the sheet itself must never write to the database.
  it('queues changed columns, including ones the query did not select, without writing', async () => {
    const writes = mockRows()
    const { onStage } = renderEditor()
    expect(await screen.findByTestId('hidden-input')).toHaveValue(originalRow.hidden)
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Changed' } })
    fireEvent.change(screen.getByTestId('hidden-input'), { target: { value: 'Also changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Queue changes' }))
    await waitFor(() =>
      expect(onStage).toHaveBeenCalledWith(originalRow, {
        name: 'Changed',
        hidden: 'Also changed',
      })
    )
    expect(writes).toHaveLength(0)
  })

  it('reopens a row with its queued values, so earlier edits are not lost or overwritten', async () => {
    mockRows()
    renderEditor({
      pendingEdits: [
        {
          table: { id: table.id, schema: table.schema, name: table.name },
          rowIdentifiers: { id: originalRow.id },
          columnName: 'name',
          oldValue: originalRow.name,
          newValue: 'Queued earlier',
        },
      ],
    })
    expect(await screen.findByTestId('name-input')).toHaveValue('Queued earlier')
    expect(screen.getByTestId('hidden-input')).toHaveValue(originalRow.hidden)
  })

  it('confirms before discarding changed fields and preserves them when keeping edits', async () => {
    const writes = mockRows()
    const { onClose, onStage } = renderEditor()
    fireEvent.change(await screen.findByTestId('name-input'), { target: { value: 'Unsaved' } })
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Unsaved changes')
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByTestId('name-input')).toHaveValue('Unsaved')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(onStage).not.toHaveBeenCalled()
    expect(writes).toHaveLength(0)
  })

  it('shows an error when the row has been deleted or is no longer visible', async () => {
    mockRows({ missing: true })
    renderEditor()
    expect(await screen.findByText('Failed to load row')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Queue changes' })).not.toBeInTheDocument()
  })
})
