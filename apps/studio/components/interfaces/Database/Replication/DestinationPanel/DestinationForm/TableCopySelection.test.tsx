import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { TableCopySelection } from './TableCopySelection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type ReplicationSourcesResponse = components['schemas']['SourcesResponse_Output']
type PublicationDetailsResponse = components['schemas']['PublicationDetailsResponse_Output']
type ReadTablesResponse = components['schemas']['ReadTablesResponse_Output']

const mockSources: ReplicationSourcesResponse = {
  sources: [
    {
      id: 1,
      name: 'default',
      tenant_id: 'tenant',
      config: { host: 'db.internal', name: 'main-db', port: 5432, username: 'etl_user' },
    },
  ],
}

const mockPublicationDetails: PublicationDetailsResponse = {
  name: 'analytics',
  config: {
    type: 'tables',
    tables: [
      { id: 101, schema: 'public', name: 'orders', columns: null, row_filter: null },
      { id: 202, schema: 'billing', name: 'invoices', columns: null, row_filter: null },
    ],
    operations: ['insert'],
    publish_via_partition_root: false,
  },
  tables: [
    { id: 101, schema: 'public', name: 'orders', kind: 'table', partition_parent_id: null },
    { id: 202, schema: 'billing', name: 'invoices', kind: 'table', partition_parent_id: null },
  ],
}

const mockSourcesEndpoint = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json<ReplicationSourcesResponse>(mockSources),
  })
}

const mockPublicationsSuccess = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
    response: () => HttpResponse.json<PublicationDetailsResponse>(mockPublicationDetails),
  })
}

const mockPublicationsError = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
  })
}

const mockPublicationsPending = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
    response: () => new Promise<never>(() => {}),
  })
}

const mockTables = (tables: ReadTablesResponse['tables']) => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/tables',
    response: () => HttpResponse.json<ReadTablesResponse>({ tables }),
  })
}

const TableCopySelectionHarness = ({
  editMode,
  mode = 'include_all_tables',
  selectedTableIds = [],
}: {
  editMode: boolean
  mode?: DestinationPanelSchemaType['tableSyncCopyMode']
  selectedTableIds?: string[]
}) => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: {
      name: 'Analytics',
      publicationName: 'analytics',
      tableSyncCopyMode: mode,
      tableSyncCopyTableIds: selectedTableIds,
    },
  })

  return (
    <Form {...form}>
      <TableCopySelection form={form} editMode={editMode} />
    </Form>
  )
}

describe('TableCopySelection', () => {
  it('explains that editing the policy does not recopy synchronized tables', async () => {
    mockSourcesEndpoint()
    mockPublicationsSuccess()

    customRender(
      <TableCopySelectionHarness editMode mode="include_tables" selectedTableIds={['101']} />
    )

    expect(
      await screen.findByText(/Changes only affect tables whose initial sync/)
    ).toBeInTheDocument()
    expect(screen.getByText('Tables to include*')).toBeInTheDocument()
  })

  it('does not show the edit-mode explanation while creating a pipeline', async () => {
    mockSourcesEndpoint()
    mockPublicationsSuccess()

    customRender(<TableCopySelectionHarness editMode={false} />)

    await screen.findByText('All tables')
    expect(
      screen.queryByText(/Changes only affect tables whose initial sync/)
    ).not.toBeInTheDocument()
  })

  it('summarizes selective copy choices against the publication table count', async () => {
    mockSourcesEndpoint()
    mockPublicationsSuccess()

    customRender(
      <TableCopySelectionHarness
        editMode={false}
        mode="include_tables"
        selectedTableIds={['101']}
      />
    )

    expect(
      await screen.findByText(
        '1 of 2 publication tables will run initial sync. Ongoing replication will still include every publication table.'
      )
    ).toBeInTheDocument()
    const trigger = screen
      .getAllByRole('combobox')
      .find((element) => element.textContent?.includes('public.orders'))!
    expect(trigger).toHaveTextContent('public.orders')
    expect(trigger).not.toHaveTextContent('101')
  })

  it('highlights configured initial-sync tables that left the publication without showing ids', async () => {
    mockSourcesEndpoint()
    mockPublicationsSuccess()
    mockTables([
      ...mockPublicationDetails.tables,
      {
        id: 999,
        schema: 'Legacy',
        name: 'ArchivedOrders',
        kind: 'table',
        partition_parent_id: null,
      },
    ])

    customRender(
      <TableCopySelectionHarness editMode mode="include_tables" selectedTableIds={['101', '999']} />
    )

    expect(await screen.findByText('Legacy.ArchivedOrders')).toBeInTheDocument()
    expect(screen.getByText('Legacy.ArchivedOrders')).toHaveClass('text-destructive-600')
    expect(screen.getByText('Some tables are no longer in the publication.')).toHaveClass(
      'text-destructive-600'
    )
    expect(screen.queryByText('No longer in publication')).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('999')
  })

  it('blocks selection and explains when publication tables cannot be loaded', async () => {
    mockSourcesEndpoint()
    mockPublicationsError()

    customRender(
      <TableCopySelectionHarness editMode mode="include_tables" selectedTableIds={['101']} />
    )

    expect(await screen.findByText(/Publication tables could not be loaded/)).toBeInTheDocument()
    expect(screen.queryByText(/previously selected table/)).not.toBeInTheDocument()
  })

  it('shows a skeleton in the open selector while publication tables are loading', async () => {
    mockSourcesEndpoint()
    mockPublicationsPending()

    customRender(
      <TableCopySelectionHarness editMode mode="include_tables" selectedTableIds={['101', '999']} />
    )

    const trigger = screen.getByRole('combobox', { name: 'Select initial sync tables' })
    expect(trigger).toBeEnabled()
    expect(trigger).not.toHaveTextContent(/loading/i)

    fireEvent.click(trigger)
    await waitFor(() => expect(document.querySelector('.shimmering-loader')).toBeInTheDocument())
    expect(screen.queryByText(/previously selected table/)).not.toBeInTheDocument()
  })
})
