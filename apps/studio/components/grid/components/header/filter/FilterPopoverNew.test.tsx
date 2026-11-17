import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { FilterPopoverNew } from './FilterPopoverNew'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { ForeignTable } from '@/data/table-editor/table-editor-types'
import { BASE_PATH } from '@/lib/constants'
import {
  TableEditorTableStateContextProvider,
  useTableEditorTableStateSnapshot,
} from '@/state/table-editor-table'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

vi.mock('@/hooks/misc/useTableEditorFiltersSort', () => ({
  useTableEditorFiltersSort: () => ({
    path: '/project/default/editor/1',
    filters: [],
    sorts: [],
    setParams: vi.fn(),
  }),
}))

const table: ForeignTable = {
  entity_type: ENTITY_TYPE.FOREIGN_TABLE,
  id: 1,
  // Empty schema skips the index advisor provider and its project queries.
  schema: '',
  name: 'colors',
  comment: null,
  foreign_server_name: '',
  foreign_data_wrapper_name: '',
  foreign_data_wrapper_handler: '',
  columns: [
    {
      id: '1.1',
      table_id: 1,
      schema: '',
      table: 'colors',
      name: 'name',
      ordinal_position: 1,
      data_type: 'text',
      format: 'text',
      is_identity: false,
      identity_generation: null,
      is_generated: false,
      is_nullable: true,
      is_updatable: true,
      is_unique: false,
      check: null,
      default_value: null,
      enums: [],
      comment: null,
    },
  ],
}

const AppliedFilters = () => {
  const snap = useTableEditorTableStateSnapshot()
  return (
    <output aria-label="Applied filters">
      {snap.filters.map(({ column, operator, value }) => `${column} ${operator} ${value}`)}
    </output>
  )
}

describe('FilterPopoverNew', () => {
  it('fetches with AI-generated filters as soon as they arrive, without waiting for a blur', async () => {
    mswServer.use(
      http.post(`${BASE_PATH}/api/ai/sql/filter-v1`, () =>
        HttpResponse.json({
          logicalOperator: 'AND',
          conditions: [{ propertyName: 'name', operator: '=', value: 'Red' }],
        })
      )
    )
    const user = userEvent.setup()
    customRender(
      <TableEditorTableStateContextProvider projectRef="default" table={table}>
        <FilterPopoverNew />
        <AppliedFilters />
      </TableEditorTableStateContextProvider>
    )

    // Enter keeps focus in the filter bar, so no blur commit can apply the filters for us.
    await user.type(screen.getByRole('textbox'), 'red colors')
    expect(await screen.findByRole('option', { name: /Ask AI/ })).toBeInTheDocument()
    await user.keyboard('{Enter}')

    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'Applied filters' })).toHaveTextContent(
        'name = Red'
      )
    )
  })
})
