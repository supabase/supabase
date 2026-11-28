import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { ColumnEditor } from './ColumnEditor'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import type { SafePostgresColumn } from '@/lib/postgres-types'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const table = {
  id: 1,
  schema: 'public',
  name: 'visits',
  columns: [],
  primary_keys: [],
  relationships: [],
} as unknown as RetrieveTableResult

// A user-defined enum whose name contains "int"
const appointmentStatusType = {
  id: 16385,
  name: 'appointment_status',
  schema: 'public',
  format: 'appointment_status',
  enums: ['booked', 'done'],
  attributes: [],
  comment: null,
  type_relation_id: null,
}

// An existing column whose built-in type name contains "int"
const intervalColumn: SafePostgresColumn = {
  id: '1.3',
  table_id: 1,
  schema: 'public',
  table: 'visits',
  name: 'duration',
  ordinal_position: 3,
  data_type: 'interval',
  format: 'interval',
  format_schema: 'pg_catalog',
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
}

const renderColumnEditor = (column?: SafePostgresColumn) =>
  customRender(
    <ColumnEditor
      column={column}
      selectedTable={table}
      visible
      closePanel={() => {}}
      saveChanges={() => {}}
      updateEditorDirty={() => {}}
    />
  )

const chooseColumnType = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => {
  await user.click(await screen.findByText('Choose a column type...'))
  const listbox = await screen.findByRole('listbox')
  await user.click(await within(listbox).findByRole('option', { name }))
}

describe('ColumnEditor identity option', () => {
  beforeEach(() => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error partial project is enough for useSelectedProjectQuery
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })

    // Enumerated types for the type picker; empty results for the other pg-meta lookups
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: ({ request }) => {
        const key = new URL(request.url).searchParams.get('key')
        if (key === 'types') return HttpResponse.json<unknown[]>([appointmentStatusType])
        return HttpResponse.json<unknown[]>([])
      },
    })
  })

  it('offers identity for a built-in integer type', async () => {
    const user = userEvent.setup()
    renderColumnEditor()

    await chooseColumnType(user, /^int8/)

    expect(await screen.findByRole('checkbox', { name: 'Is Identity' })).toBeInTheDocument()
  })

  it('does not offer identity for an enum whose name contains "int"', async () => {
    const user = userEvent.setup()
    renderColumnEditor()

    await chooseColumnType(user, /appointment_status/)

    expect(await screen.findByTitle('appointment_status')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Is Identity' })).not.toBeInTheDocument()
  })

  it('does not offer identity when editing an existing interval column', async () => {
    renderColumnEditor(intervalColumn)

    expect(await screen.findByDisplayValue('duration')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Is Identity' })).not.toBeInTheDocument()
  })
})
