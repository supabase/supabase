import { zodResolver } from '@hookform/resolvers/zod'
import { fireEvent, screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it } from 'vitest'

import {
  DestinationPanelFormSchema,
  type DestinationPanelSchemaType,
} from '../DestinationForm.schema'
import { TableOptions } from './TableOptions'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type PublicationDetailsResponse = components['schemas']['PublicationDetailsResponse_Output']
type ReadColumnsResponse = components['schemas']['ReadColumnsResponse_Output']
type ReadTablesResponse = components['schemas']['ReadTablesResponse_Output']
type SourcesResponse = components['schemas']['SourcesResponse_Output']

const publicationTable = {
  id: 101,
  schema: 'public',
  name: 'Orders',
  kind: 'table' as const,
  partition_parent_id: null,
}

const publication: PublicationDetailsResponse = {
  name: 'analytics',
  config: {
    type: 'tables',
    tables: [
      {
        id: publicationTable.id,
        schema: publicationTable.schema,
        name: publicationTable.name,
        columns: null,
        row_filter: null,
      },
    ],
    operations: ['insert'],
    publish_via_partition_root: false,
  },
  tables: [publicationTable],
}

const mockSources = () => {
  const response: SourcesResponse = {
    sources: [
      {
        id: 1,
        name: 'default',
        tenant_id: 'tenant',
        config: { host: 'db.internal', name: 'main-db', port: 5432, username: 'etl_user' },
      },
    ],
  }

  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json<SourcesResponse>(response),
  })
}

const mockPublication = (response = publication) => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
    response: () => HttpResponse.json<PublicationDetailsResponse>(response),
  })
}

const mockColumns = (tableId: number, columns: ReadColumnsResponse['columns']) => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/tables/:table_id/columns',
    response: ({ params }) => {
      if (Number(params.table_id) !== tableId) {
        return HttpResponse.json<ReadColumnsResponse>({ columns: [] })
      }
      return HttpResponse.json<ReadColumnsResponse>({ columns })
    },
  })
}

const mockTables = (tables: ReadTablesResponse['tables']) => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/tables',
    response: () => HttpResponse.json<ReadTablesResponse>({ tables }),
  })
}

const TableOptionsHarness = ({
  tableOptions,
}: {
  tableOptions: NonNullable<DestinationPanelSchemaType['tableOptions']>
}) => {
  const form = useForm<DestinationPanelSchemaType>({
    mode: 'onChange',
    resolver: zodResolver(DestinationPanelFormSchema),
    defaultValues: {
      name: 'Warehouse',
      publicationName: 'analytics',
      tableSyncCopyMode: 'include_all_tables',
      tableSyncCopyTableIds: [],
      tableOptions,
    },
  })

  return (
    <Form {...form}>
      <TableOptions control={form.control} />
      <button type="button" tabIndex={0} onClick={() => void form.trigger()}>
        Validate form
      </button>
    </Form>
  )
}

describe('TableOptions source reconciliation', () => {
  it('shows integer range validation errors beside the invalid fields', async () => {
    mockSources()
    mockPublication()
    mockColumns(101, [{ name: 'id', type: 'int8', nullable: false, primary_key: true }])

    customRender(
      <TableOptionsHarness
        tableOptions={[
          {
            tableId: 101,
            partitionBy: {
              kind: 'integer_range',
              column: 'id',
              start: 0,
              end: 0,
              interval: 0,
            },
          },
        ]}
      />
    )

    await screen.findByText('public.Orders')
    fireEvent.click(screen.getByRole('button', { name: 'Validate form' }))
    expect(await screen.findByText('End must be greater than start.')).toBeInTheDocument()
    expect(await screen.findByText('Interval must be greater than 0.')).toBeInTheDocument()
  })

  it('marks configured columns that no longer exist while preserving valid names and types', async () => {
    mockSources()
    mockPublication()
    mockColumns(101, [
      { name: 'region', type: 'text', nullable: false, primary_key: false },
      { name: 'CreatedAt', type: 'timestamptz', nullable: false, primary_key: false },
    ])

    customRender(
      <TableOptionsHarness
        tableOptions={[
          {
            tableId: 101,
            partitionBy: { kind: 'time_column', column: 'DroppedAt', granularity: 'day' },
            clusterBy: ['region', 'LegacySegment'],
          },
        ]}
      />
    )

    expect(
      await screen.findByText(/Some columns are no longer in the source or publication/)
    ).toHaveClass('text-destructive-600')
    expect(screen.getAllByText('region')[0]).toBeInTheDocument()
    expect(screen.getByText('text')).toBeInTheDocument()
    expect(screen.getByText('DroppedAt').parentElement).toHaveClass('text-destructive-600')
    expect(screen.getByText('LegacySegment').parentElement).toHaveClass('text-destructive-600')
  })

  it('marks existing columns that are no longer included in the publication', async () => {
    mockSources()
    mockPublication({
      ...publication,
      config: {
        type: 'tables',
        tables: [
          {
            id: publicationTable.id,
            schema: publicationTable.schema,
            name: publicationTable.name,
            columns: ['region'],
            row_filter: null,
          },
        ],
        operations: ['insert'],
        publish_via_partition_root: false,
      },
    })
    mockColumns(101, [
      { name: 'region', type: 'text', nullable: false, primary_key: false },
      { name: 'PrivateNote', type: 'text', nullable: true, primary_key: false },
    ])

    customRender(
      <TableOptionsHarness tableOptions={[{ tableId: 101, clusterBy: ['PrivateNote'] }]} />
    )

    expect(
      await screen.findByText(/Some columns are no longer in the source or publication/)
    ).toHaveClass('text-destructive-600')
    expect(screen.getByText('PrivateNote').parentElement).toHaveClass('text-destructive-600')
  })

  it('inherits explicit column filters through nested partition ancestors', async () => {
    mockSources()
    mockPublication({
      ...publication,
      config: {
        type: 'tables',
        tables: [
          {
            id: 10,
            schema: 'public',
            name: 'Events',
            columns: ['AllowedColumn'],
            row_filter: null,
          },
        ],
        operations: ['insert'],
        publish_via_partition_root: false,
      },
      tables: [
        {
          id: 12,
          schema: 'public',
          name: 'Events2026August',
          kind: 'table',
          partition_parent_id: 11,
        },
      ],
    })
    mockTables([
      {
        id: 10,
        schema: 'public',
        name: 'Events',
        kind: 'partitioned_table',
        partition_parent_id: null,
      },
      {
        id: 11,
        schema: 'public',
        name: 'Events2026',
        kind: 'partitioned_table',
        partition_parent_id: 10,
      },
      {
        id: 12,
        schema: 'public',
        name: 'Events2026August',
        kind: 'table',
        partition_parent_id: 11,
      },
    ])
    mockColumns(12, [
      { name: 'AllowedColumn', type: 'text', nullable: false, primary_key: false },
      { name: 'ExcludedColumn', type: 'text', nullable: false, primary_key: false },
    ])

    customRender(
      <TableOptionsHarness tableOptions={[{ tableId: 12, clusterBy: ['ExcludedColumn'] }]} />
    )

    expect(
      await screen.findByText(/Some columns are no longer in the source or publication/)
    ).toBeInTheDocument()
    expect(screen.getByText('ExcludedColumn').parentElement).toHaveClass('text-destructive-600')
  })

  it('does not treat an unresolved partition ancestry as publishing every column', async () => {
    mockSources()
    mockPublication({
      ...publication,
      config: {
        type: 'tables',
        tables: [
          {
            id: 10,
            schema: 'public',
            name: 'Events',
            columns: ['AllowedColumn'],
            row_filter: null,
          },
        ],
        operations: ['insert'],
        publish_via_partition_root: false,
      },
      tables: [
        {
          id: 12,
          schema: 'public',
          name: 'Events2026August',
          kind: 'table',
          partition_parent_id: 11,
        },
      ],
    })
    mockTables([
      {
        id: 12,
        schema: 'public',
        name: 'Events2026August',
        kind: 'table',
        partition_parent_id: 11,
      },
    ])
    mockColumns(12, [
      { name: 'AllowedColumn', type: 'text', nullable: false, primary_key: false },
      { name: 'UnverifiedColumn', type: 'text', nullable: false, primary_key: false },
    ])

    customRender(
      <TableOptionsHarness tableOptions={[{ tableId: 12, clusterBy: ['UnverifiedColumn'] }]} />
    )

    expect(
      await screen.findByText(
        'Unable to verify columns against the source and publication. Refresh and try again.'
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Some columns are no longer in the source or publication/)
    ).not.toBeInTheDocument()
  })

  it('hides settings for a table removed from the publication without exposing its id', async () => {
    mockSources()
    mockPublication()
    mockTables([
      publicationTable,
      {
        id: 202,
        schema: 'Billing',
        name: 'Invoices',
        kind: 'table',
        partition_parent_id: null,
      },
    ])
    customRender(<TableOptionsHarness tableOptions={[{ tableId: 202, clusterBy: ['Region'] }]} />)

    expect(await screen.findByText('Billing.Invoices')).toBeInTheDocument()
    expect(screen.getByText('Billing.Invoices')).toHaveClass('text-destructive-600')
    expect(screen.getByText('Some tables are no longer in the publication.')).toHaveClass(
      'text-destructive-600'
    )
    expect(screen.queryByText('No longer in this publication')).not.toBeInTheDocument()
    expect(screen.queryByText('Region')).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('202')
  })

  it('does not match a dropped and recreated table by name instead of id', async () => {
    mockSources()
    mockPublication()
    mockTables([
      publicationTable,
      {
        id: 1000,
        schema: 'public',
        name: 'PreviouslyConfigured',
        kind: 'table',
        partition_parent_id: null,
      },
    ])

    customRender(
      <TableOptionsHarness
        tableOptions={[
          {
            tableId: 999,
            partitionBy: { kind: 'time_column', column: 'OccurredAt', granularity: 'day' },
          },
        ]}
      />
    )

    expect(await screen.findByText('Previously configured table')).toBeInTheDocument()
    expect(screen.queryByText('OccurredAt')).not.toBeInTheDocument()
    expect(screen.getByText('Some tables are no longer in the publication.')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('999')
  })
})
