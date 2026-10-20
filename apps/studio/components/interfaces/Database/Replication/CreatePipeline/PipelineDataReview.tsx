import { EditIcon } from 'lucide-react'
import { useWatch, type Control } from 'react-hook-form'
import { Button, Input } from 'ui'
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
  onEdit,
}: {
  type: DestinationType
  control: Control<DestinationPanelSchemaType>
  publication?: ReplicationPublicationData
  onEdit?: () => void
}) => {
  const [publicationName, mode, ids, workers, copies, slot, batch, options] = useWatch({
    control,
    name: [
      'publicationName',
      'tableSyncCopyMode',
      'tableSyncCopyTableIds',
      'maxTableSyncWorkers',
      'maxCopyConnectionsPerTable',
      'invalidatedSlotBehavior',
      'maxFillMs',
      'tableOptions',
    ],
  })
  const tables = publication?.name === publicationName ? publication.tables : undefined
  const rows: { label: string; value: string; description: string }[] = [
    { ...PUBLICATION_FIELD_COPY, value: publicationName || 'None selected' },
    {
      label: 'Publication tables',
      description: 'Tables whose ongoing changes will be replicated to this destination.',
      value: tables
        ? `${tables.length} ${tables.length === 1 ? 'table' : 'tables'}`
        : 'Unavailable',
    },
    {
      ...INITIAL_SYNC_FIELD_COPY,
      description:
        'Controls which publication tables copy their existing rows. Ongoing replication includes new changes from every publication table, even when initial sync is skipped.',
      value: INITIAL_SYNC_LABELS[mode] ?? 'Not set',
    },
  ]
  if (mode === 'include_tables' || mode === 'skip_tables') {
    const selected = tables?.filter((table) => ids?.includes(String(table.id)))
    rows.push({
      label: mode === 'include_tables' ? 'Tables to include' : 'Tables to exclude',
      description:
        mode === 'include_tables'
          ? 'Only these tables copy their existing rows during initial sync. Ongoing changes from every publication table are replicated.'
          : 'These tables skip copying existing rows during initial sync. Ongoing changes from every publication table are replicated.',
      value: tables
        ? selected?.map(({ schema, name }) => `${schema}.${name}`).join(', ') || 'None selected'
        : 'Unavailable',
    })
  }
  const addNumber = (
    label: string,
    value: number | '' | undefined,
    defaultValue: number,
    description: string,
    unit = ''
  ) => {
    if (typeof value === 'number' && value !== defaultValue)
      rows.push({ label, value: `${value}${unit}`, description })
  }
  addNumber(
    'Batch wait time',
    batch,
    defaults.DEFAULT_MAX_FILL_MS,
    'Maximum time before sending a partially filled batch.',
    ' milliseconds'
  )
  addNumber(
    'Table sync workers',
    workers,
    defaults.DEFAULT_MAX_TABLE_SYNC_WORKERS,
    'Maximum number of tables synced at the same time.'
  )
  addNumber(
    'Initial sync connections per table',
    copies,
    defaults.DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE,
    'Maximum number of source connections used to sync existing rows for each table.'
  )
  if (slot === 'recreate')
    rows.push({
      label: 'Invalidated slot behavior',
      value: 'Recreate slot',
      description:
        'If the replication slot becomes invalid, the pipeline replaces destination tables and runs a new, billable initial sync.',
    })
  const layouts =
    type === 'BigQuery'
      ? (options ?? []).filter(
          (option) =>
            tables?.some(({ id }) => id === option.tableId) &&
            (option.partitionBy || option.clusterBy?.length)
        )
      : []
  return (
    <section aria-label="Data review" className="space-y-6 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">Data</h3>
        {onEdit && (
          <Button
            type="button"
            icon={<EditIcon />}
            size="tiny"
            aria-label="Edit data"
            onClick={onEdit}
          >
            Edit
          </Button>
        )}
      </div>
      {rows.map((row) => (
        <ReviewField key={row.label} {...row} />
      ))}
      {layouts.length > 0 && (
        <FormItemLayout
          isReactForm={false}
          layout="horizontal"
          label="Table layout"
          description="Partitioning and clustering applied when destination tables are first created or reset."
        >
          <div className="min-w-0 space-y-3">
            {layouts.map((option) => {
              const table = tables?.find(({ id }) => id === option.tableId)
              const name = table ? `${table.schema}.${table.name}` : `Table ${option.tableId}`
              return (
                <div key={option.tableId} className="min-w-0 rounded-md border bg-surface-200 p-3">
                  <p className="break-all text-sm text-foreground">{name}</p>
                  <p className="mt-1 break-words text-sm text-foreground-light">
                    {describeBigQueryTableLayout(option)}
                  </p>
                </div>
              )
            })}
          </div>
        </FormItemLayout>
      )}
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
  description: string
}) => (
  <FormItemLayout isReactForm={false} layout="horizontal" label={label} description={description}>
    <Input readOnly aria-label={label} value={value} />
  </FormItemLayout>
)
