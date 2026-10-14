import { fireEvent, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Button } from 'ui'
import { describe, expect, it } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import { PipelineConnectionReview } from './PipelineConnectionReview'
import { PipelineDataReview } from './PipelineDataReview'
import { describeBigQueryTableLayout } from './PipelineReviewSummary.utils'
import type { ReplicationPublicationData } from '@/data/replication/publication-query'
import { customRender } from '@/tests/lib/custom-render'

const publication: ReplicationPublicationData = {
  name: 'analytics',
  config: { type: 'all_tables', operations: ['insert'], publish_via_partition_root: false },
  tables: [{ id: 101, schema: 'public', name: 'orders', kind: 'table', partition_parent_id: null }],
}
const TestReview = ({
  type = 'BigQuery',
  values = {},
  available = true,
}: {
  type?: DestinationType
  values?: Partial<DestinationPanelSchemaType>
  available?: boolean
}) => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: {
      publicationName: 'analytics',
      tableSyncCopyMode: 'include_all_tables',
      tableSyncCopyTableIds: [],
      maxFillMs: 10000,
      maxTableSyncWorkers: 4,
      maxCopyConnectionsPerTable: 4,
      connectionPoolSize: 4,
      ducklakePoolSize: 4,
      invalidatedSlotBehavior: 'error',
      ...values,
    },
  })
  return (
    <>
      <PipelineConnectionReview type={type} control={form.control} />
      <PipelineDataReview
        type={type}
        control={form.control}
        publication={available ? publication : undefined}
      />
      <Button onClick={() => form.setValue('maxTableSyncWorkers', 8)}>Change workers</Button>
      <Button onClick={() => form.setValue('publicationName', 'other')}>Change publication</Button>
    </>
  )
}

describe('PipelineDataReview', () => {
  it('shows data defaults without unchanged advanced settings and reacts to changes', () => {
    customRender(<TestReview />)
    expect(screen.getByLabelText('Publication')).toHaveValue('analytics')
    expect(screen.getByLabelText('Publication tables')).toHaveValue('1 table')
    expect(screen.getByLabelText('Initial sync')).toHaveValue('All tables')
    expect(screen.queryByLabelText('Table sync workers')).not.toBeInTheDocument()
    expect(screen.queryByText('Custom connection settings')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Change workers'))
    expect(screen.getByLabelText('Table sync workers')).toHaveValue('8')
    expect(
      screen.getByText('Maximum number of tables synced at the same time.')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByText('Change publication'))
    expect(screen.getByLabelText('Publication tables')).toHaveValue('Unavailable')
  })
  it.each(['include_tables', 'skip_tables'] as const)(
    'lists selected publication tables for %s',
    (mode) => {
      customRender(
        <TestReview values={{ tableSyncCopyMode: mode, tableSyncCopyTableIds: ['101', '999'] }} />
      )
      expect(
        screen.getByLabelText(mode === 'include_tables' ? 'Tables to include' : 'Tables to exclude')
      ).toHaveValue('public.orders')
    }
  )
  it('shows custom replication and BigQuery settings and only configured layouts', () => {
    customRender(
      <TestReview
        values={{
          maxFillMs: 500,
          maxCopyConnectionsPerTable: 8,
          invalidatedSlotBehavior: 'recreate',
          connectionPoolSize: 6,
          maxStalenessMins: 0,
          tableOptions: [{ tableId: 101, clusterBy: ['id'] }, { tableId: 999 }],
        }}
      />
    )
    expect(screen.getByLabelText('Batch wait time')).toHaveValue('500 milliseconds')
    expect(
      screen.getByText('Maximum time before sending a partially filled batch.')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Maximum number of source connections used to sync existing rows for each table.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'If the replication slot becomes invalid, the pipeline replaces destination tables and runs a new, billable initial sync.'
      )
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Connection pool size')).toHaveValue('6')
    expect(screen.getByLabelText('Maximum staleness')).toHaveValue('0 minutes')
    expect(screen.getByText('public.orders')).toBeInTheDocument()
    expect(screen.getByText('No partitioning; Cluster by id')).toBeInTheDocument()
    expect(screen.queryByText('Table 999')).not.toBeInTheDocument()
  })
  it.each([
    { type: 'DuckLake', values: { ducklakePoolSize: 6 }, label: 'Pool size', value: '6' },
    { type: 'Snowflake', values: { snowflakeRole: 'ANALYST' }, label: 'Role', value: 'ANALYST' },
  ] satisfies {
    type: DestinationType
    values: Partial<DestinationPanelSchemaType>
    label: string
    value: string
  }[])('shows custom settings for $type', ({ type, values, label, value }) => {
    customRender(<TestReview type={type} values={values} />)
    expect(screen.getByLabelText(label)).toHaveValue(value)
    expect(screen.queryByLabelText('Connection pool size')).not.toBeInTheDocument()
  })
  it('marks unavailable publication data without inventing a table count', () => {
    customRender(<TestReview available={false} />)
    expect(screen.getByLabelText('Publication tables')).toHaveValue('Unavailable')
  })
  it('puts the table name and incomplete partition summary in the value column', () => {
    customRender(
      <TestReview
        values={{
          tableOptions: [
            {
              tableId: 101,
              partitionBy: { kind: 'time_column', column: '', granularity: 'month' },
              clusterBy: ['table_id'],
            },
          ],
        }}
      />
    )
    expect(screen.getByText('Table layout')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Partitioning and clustering applied when destination tables are first created or reset.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('public.orders')).toHaveClass('break-all')
    expect(screen.getByText('Partition by Not selected (month); Cluster by table_id')).toHaveClass(
      'break-words'
    )
    expect(screen.queryByText('Table layout: public.orders')).not.toBeInTheDocument()
  })

  it('does not describe unavailable selections as empty or show stale layouts', () => {
    const view = customRender(
      <TestReview
        available={false}
        values={{
          tableSyncCopyMode: 'include_tables',
          tableSyncCopyTableIds: ['101'],
          tableOptions: [{ tableId: 999, clusterBy: ['id'] }],
        }}
      />
    )
    expect(screen.getByLabelText('Tables to include')).toHaveValue('Unavailable')
    expect(screen.queryByText('Table 999')).not.toBeInTheDocument()
    view.unmount()
    customRender(<TestReview values={{ tableOptions: [{ tableId: 999, clusterBy: ['id'] }] }} />)
    expect(screen.queryByText('Table layout')).not.toBeInTheDocument()
  })

  it('describes each partition mode', () => {
    expect(
      describeBigQueryTableLayout({
        tableId: 1,
        partitionBy: { kind: 'ingestion_time', granularity: 'day' },
      })
    ).toBe('Partition by ingestion time (day); No clustering')
    expect(
      describeBigQueryTableLayout({
        tableId: 1,
        partitionBy: { kind: 'time_column', column: 'created_at', granularity: 'day' },
      })
    ).toBe('Partition by created_at (day); No clustering')
    expect(
      describeBigQueryTableLayout({
        tableId: 1,
        partitionBy: { kind: 'integer_range', column: 'id', start: 0, end: 100, interval: 10 },
      })
    ).toBe('Partition by id (range 0 to 100, interval 10); No clustering')
  })
})
