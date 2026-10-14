import { useWatch, type Control } from 'react-hook-form'
import { Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import * as defaults from '../DestinationPanel/DestinationForm/DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import {
  INITIAL_SYNC_FIELD_COPY,
  INITIAL_SYNC_LABELS,
  PUBLICATION_FIELD_COPY,
} from '../DestinationPanel/DestinationForm/DestinationFormFieldCopy'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import { describeBigQueryTableLayout } from './PipelineReviewSummary.utils'
import type { ReplicationPublicationData } from '@/data/replication/publication-query'

export const PipelineDataReview = ({
  type,
  control,
  publication,
}: {
  type: DestinationType
  control: Control<DestinationPanelSchemaType>
  publication?: ReplicationPublicationData
}) => {
  const [
    publicationName,
    mode,
    ids,
    workers,
    copies,
    slot,
    batch,
    pool,
    staleness,
    lakePool,
    role,
    options,
  ] = useWatch({
    control,
    name: [
      'publicationName',
      'tableSyncCopyMode',
      'tableSyncCopyTableIds',
      'maxTableSyncWorkers',
      'maxCopyConnectionsPerTable',
      'invalidatedSlotBehavior',
      'maxFillMs',
      'connectionPoolSize',
      'maxStalenessMins',
      'ducklakePoolSize',
      'snowflakeRole',
      'tableOptions',
    ],
  })
  const tables = publication?.name === publicationName ? publication.tables : undefined
  const rows: { label: string; value: string; description?: string }[] = [
    { ...PUBLICATION_FIELD_COPY, value: publicationName || 'None selected' },
    {
      label: 'Publication tables',
      value: tables
        ? `${tables.length} ${tables.length === 1 ? 'table' : 'tables'}`
        : 'Unavailable',
    },
    { ...INITIAL_SYNC_FIELD_COPY, value: INITIAL_SYNC_LABELS[mode] ?? 'Not set' },
  ]
  if (mode === 'include_tables' || mode === 'skip_tables') {
    const selected = tables?.filter((table) => ids?.includes(String(table.id)))
    rows.push({
      label: mode === 'include_tables' ? 'Tables to include' : 'Tables to exclude',
      value: selected?.map(({ schema, name }) => `${schema}.${name}`).join(', ') || 'None selected',
    })
  }
  const addNumber = (
    label: string,
    value: number | '' | undefined,
    defaultValue: number,
    unit = ''
  ) => {
    if (typeof value === 'number' && value !== defaultValue)
      rows.push({ label, value: `${value}${unit}` })
  }
  addNumber('Batch wait time', batch, defaults.DEFAULT_MAX_FILL_MS, ' milliseconds')
  addNumber('Table sync workers', workers, defaults.DEFAULT_MAX_TABLE_SYNC_WORKERS)
  addNumber(
    'Initial sync connections per table',
    copies,
    defaults.DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE
  )
  if (slot === 'recreate')
    rows.push({
      label: 'Invalidated slot behavior',
      value: 'Recreate slot',
      description: 'Replaces destination tables and runs a new, billable initial sync.',
    })
  const connectionRows: typeof rows = []
  if (type === 'BigQuery') {
    if (typeof pool === 'number' && pool !== defaults.DEFAULT_CONNECTION_POOL_SIZE)
      connectionRows.push({ label: 'Connection pool size', value: String(pool) })
    if (typeof staleness === 'number')
      connectionRows.push({ label: 'Maximum staleness', value: `${staleness} minutes` })
    for (const option of options ?? []) {
      if (!option.partitionBy && !option.clusterBy?.length) continue
      const table = tables?.find(({ id }) => id === option.tableId)
      rows.push({
        label: `Table layout: ${table ? `${table.schema}.${table.name}` : `Table ${option.tableId}`}`,
        value: describeBigQueryTableLayout(option),
      })
    }
  }
  if (
    type === 'DuckLake' &&
    typeof lakePool === 'number' &&
    lakePool !== defaults.DEFAULT_DUCKLAKE_POOL_SIZE
  )
    connectionRows.push({ label: 'Pool size', value: String(lakePool) })
  if (type === 'Snowflake' && role?.trim()) connectionRows.push({ label: 'Role', value: role })
  return (
    <section aria-label="Data review" className="space-y-6 p-5">
      {connectionRows.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-foreground">Custom connection settings</h3>
          {connectionRows.map((row) => (
            <ReviewField key={row.label} {...row} />
          ))}
        </>
      )}
      <h3 className="text-sm font-medium text-foreground">Data</h3>
      {rows.map((row) => (
        <ReviewField key={row.label} {...row} />
      ))}
    </section>
  )
}

const ReviewField = ({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description?: string
}) => (
  <FormItemLayout isReactForm={false} layout="horizontal" label={label} description={description}>
    <Input readOnly aria-label={label} value={value} />
  </FormItemLayout>
)
