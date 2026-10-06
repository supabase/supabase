import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { PIPELINE_REGION } from '../DestinationPanel/DestinationForm/PipelineRegionField'
import { PipelineReviewSummary } from './PipelineReviewSummary'
import { customRender } from '@/tests/lib/custom-render'

const values = {
  name: 'Analytics pipeline',
  publicationName: 'analytics',
  tableSyncCopyMode: 'include_all_tables',
  tableSyncCopyTableIds: [],
  projectId: 'gcp-project',
  datasetId: 'dataset',
} as unknown as DestinationPanelSchemaType

describe('PipelineReviewSummary', () => {
  test('jumps to the matching step from each Edit control', () => {
    const onGoToStep = vi.fn()

    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publication={undefined}
        onGoToStep={onGoToStep}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit destination' }))
    expect(onGoToStep).toHaveBeenCalledWith('destination')

    fireEvent.click(screen.getByRole('button', { name: 'Edit connection' }))
    expect(onGoToStep).toHaveBeenCalledWith('connection')

    fireEvent.click(screen.getByRole('button', { name: 'Edit data' }))
    expect(onGoToStep).toHaveBeenCalledWith('data')
  })

  test('does not render a source section', () => {
    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publication={undefined}
        onGoToStep={vi.fn()}
      />
    )

    expect(screen.queryByRole('heading', { name: 'Source' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit destination' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Edit / })).toHaveLength(3)
  })

  test('shows the destination logo and lifecycle information', () => {
    const { container } = customRender(
      <PipelineReviewSummary
        type="Snowflake"
        values={values}
        publication={undefined}
        onGoToStep={vi.fn()}
      />
    )

    expect(
      screen.getByText(
        'Destination type cannot be changed after creation. Snowflake support is in public alpha.'
      )
    ).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/img/icons/snowflake-icon.svg')
    )
  })

  test('shows the pipeline name field description from the connection step', () => {
    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publication={undefined}
        onGoToStep={vi.fn()}
      />
    )

    expect(screen.getByText('Used to identify this pipeline in Supabase.')).toBeInTheDocument()
  })

  test('disables Edit while the pipeline is being created', () => {
    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publication={undefined}
        editDisabled
        onGoToStep={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Edit destination' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit connection' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit data' })).toBeDisabled()
  })

  test('shows destination type with icon on the destination section', () => {
    const { container } = customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publication={undefined}
        onGoToStep={vi.fn()}
      />
    )

    expect(screen.getByText('BigQuery')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  test('shows pipeline region with flag and AWS code on the connection section', () => {
    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publication={undefined}
        onGoToStep={vi.fn()}
      />
    )

    expect(screen.getByText(PIPELINE_REGION.displayName)).toBeInTheDocument()
    expect(screen.getByText(PIPELINE_REGION.code)).toBeInTheDocument()
  })

  test('shows connection failures in the connection section', () => {
    const onGoToStep = vi.fn()

    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publication={undefined}
        connectionFailures={[
          {
            name: 'BigQuery Authentication Failed',
            reason: 'The service account key is invalid.',
            failure_type: 'critical',
          },
        ]}
        onGoToStep={onGoToStep}
      />
    )

    expect(screen.getByText('BigQuery Authentication Failed')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Check destination credentials and connection settings, including Advanced settings on this step.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText('1 issue must be resolved above before you can start the pipeline.')
    ).toBeInTheDocument()
    expect(screen.getAllByLabelText('Danger')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Edit connection' }))
    expect(onGoToStep).toHaveBeenCalledWith('connection')
  })

  test('repeats warning status beside the final action', () => {
    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publication={undefined}
        dataFailures={[
          {
            name: 'Low Slot WAL Retention',
            reason: 'Increase max_slot_wal_keep_size.',
            failure_type: 'warning',
          },
        ]}
        onGoToStep={vi.fn()}
      />
    )

    expect(
      screen.getByText('Review the warning above before starting the pipeline.')
    ).toBeInTheDocument()
    expect(screen.getAllByLabelText('Warning')).toHaveLength(2)
  })
})

test('masks the whole catalog URL and lets users reveal and hide it', () => {
  const catalogUrl = 'postgresql://admin:dummy-password@catalog.example/db?sslmode=require'
  customRender(
    <PipelineReviewSummary
      type="DuckLake"
      values={{ ...values, ducklakeMode: 'custom', ducklakeCatalogUrl: catalogUrl }}
      onGoToStep={vi.fn()}
    />
  )
  const input = screen.getByLabelText('Catalog URL')
  expect(input).toHaveValue(catalogUrl)
  expect(input).toHaveAttribute('type', 'password')
  expect(input).toHaveAttribute('readonly')
  fireEvent.click(screen.getByRole('button', { name: 'Show catalog URL' }))
  expect(input).toHaveAttribute('type', 'text')
  fireEvent.click(screen.getByRole('button', { name: 'Hide catalog URL' }))
  expect(input).toHaveAttribute('type', 'password')
})

test('shows advanced settings and the consequences of recreating a slot', () => {
  customRender(
    <PipelineReviewSummary
      type="BigQuery"
      values={{
        ...values,
        maxFillMs: 500,
        maxTableSyncWorkers: 8,
        maxCopyConnectionsPerTable: 2,
        invalidatedSlotBehavior: 'recreate',
        connectionPoolSize: 6,
        maxStalenessMins: 15,
        tableOptions: [
          { tableId: 101, partitionBy: { kind: 'ingestion_time' }, clusterBy: ['id'] },
        ],
      }}
      onGoToStep={vi.fn()}
    />
  )
  for (const value of ['500 milliseconds', '8', '2', '6', '15 minutes', 'Recreate slot']) {
    expect(screen.getByDisplayValue(value)).toBeInTheDocument()
  }
  expect(
    screen.getByText('Replaces destination tables and runs a new, billable initial sync.')
  ).toBeInTheDocument()
  expect(
    screen.getByDisplayValue('Partition by ingestion time (day); Cluster by id')
  ).toBeInTheDocument()
})

test.each([
  {
    type: 'Snowflake' as const,
    fields: { snowflakeRole: 'PIPELINES_ROLE' },
    expected: 'PIPELINES_ROLE',
  },
  { type: 'DuckLake' as const, fields: { ducklakePoolSize: 3 }, expected: '3' },
])('shows $type connection overrides', ({ type, fields, expected }) => {
  customRender(
    <PipelineReviewSummary type={type} values={{ ...values, ...fields }} onGoToStep={vi.fn()} />
  )
  expect(screen.getByDisplayValue(expected)).toBeInTheDocument()
})

test.each(['BigQuery', 'DuckLake', 'Snowflake', 'ClickHouse'] as const)(
  'omits default advanced settings for %s',
  (type) => {
    customRender(
      <PipelineReviewSummary
        type={type}
        values={{
          ...values,
          maxFillMs: 10000,
          maxTableSyncWorkers: 4,
          maxCopyConnectionsPerTable: 4,
          connectionPoolSize: 4,
          ducklakePoolSize: 4,
          invalidatedSlotBehavior: 'error',
          snowflakeRole: '',
          tableOptions: [{ tableId: 101, clusterBy: [] }],
        }}
        onGoToStep={vi.fn()}
      />
    )
    for (const label of [
      'Batch wait time',
      'Table sync workers',
      'Initial sync connections per table',
      'Invalidated slot behavior',
      'Connection pool size',
      'Maximum staleness',
      'Pool size',
      'Role',
      'Table layout: Table 101',
    ]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument()
    }
  }
)
