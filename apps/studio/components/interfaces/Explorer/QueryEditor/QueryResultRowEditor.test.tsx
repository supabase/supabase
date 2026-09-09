import type { PGTable } from '@supabase/pg-meta'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { QueryResultRowEditor } from './QueryResultRowEditor'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

// Monaco and the foreign-row browser have separate coverage. Keep the real row form,
// mutation, SQL builder, and network requests for these save/discard integration tests.
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

function mockRows({ failFirstSave = false, missing = false } = {}) {
  const writes: string[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const { query } = z.object({ query: z.string() }).parse(await request.json())
      if (new URL(request.url).searchParams.get('key') === 'table-row-update-42') {
        writes.push(query)
        if (failFirstSave && writes.length === 1)
          return HttpResponse.json<APIErrorBody>({ message: 'Permission denied' }, { status: 403 })
        return HttpResponse.json<Record<string, unknown>[]>([
          { ...originalRow, id: 'new-id', name: 'Server value' },
        ])
      }
      if (/select\s+\*/i.test(query))
        return HttpResponse.json<Record<string, unknown>[]>(missing ? [] : [originalRow])
      return HttpResponse.json<Record<string, unknown>[]>([])
    },
  })
  return writes
}

function renderEditor() {
  const onSave = vi.fn()
  const onClose = vi.fn()
  const view = customRender(
    <QueryResultRowEditor
      projectRef="default"
      table={table}
      identifiers={{ id: originalRow.id }}
      onClose={onClose}
      onSave={onSave}
      roleImpersonationState={{ role: { type: 'custom', role: 'query_role' }, claims: undefined }}
    />
  )
  return { ...view, onSave, onClose }
}

describe('query result row editing', () => {
  it('loads the full row and saves through the original key and captured role', async () => {
    const writes = mockRows()
    const { onSave } = renderEditor()
    expect(await screen.findByTestId('hidden-input')).toHaveValue(originalRow.hidden)
    fireEvent.change(screen.getByTestId('id-input'), { target: { value: 'new-id' } })
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ ...originalRow, id: 'new-id', name: 'Server value' })
    )
    expect(writes).toHaveLength(1)
    expect(writes[0]).toContain('query_role')
    expect(writes[0]).toMatch(/where\s+"?id"? = 'original-id'/i)
    expect(writes[0]).toMatch(/returning\s+\*/i)
    expect(writes[0]).not.toContain('"hidden" =')
  })

  it('retains input after a failed save and allows retry', async () => {
    const writes = mockRows({ failFirstSave: true })
    const { onSave } = renderEditor()
    fireEvent.change(await screen.findByTestId('name-input'), { target: { value: 'Retry me' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(writes).toHaveLength(1))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByTestId('name-input')).toHaveValue('Retry me')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce())
    expect(writes).toHaveLength(2)
  })

  it('confirms before discarding changed fields and preserves them when keeping edits', async () => {
    const writes = mockRows()
    const { onClose } = renderEditor()
    fireEvent.change(await screen.findByTestId('name-input'), { target: { value: 'Unsaved' } })
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Unsaved changes')
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByTestId('name-input')).toHaveValue('Unsaved')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(writes).toHaveLength(0)
  })

  it('shows an error when the row has been deleted or is no longer visible', async () => {
    mockRows({ missing: true })
    renderEditor()
    expect(await screen.findByText('Failed to load row')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })
})
