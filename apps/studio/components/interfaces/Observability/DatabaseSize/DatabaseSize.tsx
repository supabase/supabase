import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from 'ui'

import { sizePercentage, type SizeMetric } from './DatabaseSize.utils'
import { DatabaseSizeCharts } from './DatabaseSizeCharts'
import { DatabaseSizeTable } from './DatabaseSizeTable'
import { AlertError } from '@/components/ui/AlertError'
import { LazyComposedChartHandler } from '@/components/ui/Charts/ComposedChartHandler'
import { databaseSizeBreakdownQueryOptions } from '@/data/database/database-size-breakdown-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatBytes } from '@/lib/helpers'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'

const metrics: { value: SizeMetric; label: string }[] = [
  { value: 'total', label: 'Total size (table + indexes + TOAST)' },
  { value: 'table', label: 'Table size' },
  { value: 'index', label: 'Index size' },
  { value: 'toast', label: 'TOAST size' },
]

type DatabaseSizeProps = {
  diskAction: ReactNode
  startDate?: string
  endDate?: string
  interval?: string
  updateDateRange: (from: string, to: string) => void
}

export function DatabaseSize({
  diskAction,
  startDate,
  endDate,
  interval,
  updateDateRange,
}: DatabaseSizeProps) {
  const { data: project } = useSelectedProjectQuery()
  const { selectedDatabaseId } = useDatabaseSelectorStateSnapshot()
  const {
    data: databases = [],
    error: databasesError,
    isSuccess: hasDatabases,
  } = useReadReplicasQuery({
    projectRef: project?.ref,
  })
  const [metric, setMetric] = useState<SizeMetric>('total')
  const databaseIdentifier = selectedDatabaseId ?? project?.ref
  const isPrimarySelected = databaseIdentifier === project?.ref
  const database = databases.find((item) => item.identifier === databaseIdentifier)
  const connectionString = isPrimarySelected
    ? (database?.connection_string_read_only ?? project?.connectionString)
    : database?.connection_string_read_only
  const hasSelectedConnection = isPrimarySelected || !!connectionString
  const snapshot = useQuery({
    ...databaseSizeBreakdownQueryOptions({
      projectRef: project?.ref,
      databaseIdentifier,
      connectionString,
    }),
    enabled: !!project?.ref && hasSelectedConnection,
  })
  const provisionedBytes = (project?.volumeSizeGb ?? 0) * 1024 ** 3
  const canShowProvisioned = isPrimarySelected && provisionedBytes > 0
  const isSelectionUnavailable =
    !isPrimarySelected && !hasSelectedConnection && (!!databasesError || hasDatabases)

  const hasSnapshotError = snapshot.isError || isSelectionUnavailable

  return (
    <section id="database-size-report" className="rounded-lg border bg-surface-100 p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Database size</h2>
          <p className="mt-1 text-sm text-foreground-light">
            Space used by schemas, tables, indexes, and TOAST
          </p>
        </div>
        <div className="w-full min-w-0 space-y-1 sm:w-auto">
          <label htmlFor="database-size-metric" className="text-xs text-foreground-light">
            Treemap size
          </label>
          <Select
            value={metric}
            onValueChange={(value) => {
              const next = metrics.find((item) => item.value === value)
              if (next) setMetric(next.value)
            }}
          >
            <SelectTrigger id="database-size-metric" className="w-full sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-8">
        <div className="space-y-1">
          <p className="text-sm text-foreground-light">Space used</p>
          {snapshot.data && (
            <>
              <p className="text-2xl font-semibold">{formatBytes(snapshot.data.instance_bytes)}</p>
              {canShowProvisioned && (
                <p className="text-xs text-foreground-light">
                  {sizePercentage(snapshot.data.instance_bytes, provisionedBytes)} of{' '}
                  {project?.volumeSizeGb} GB
                </p>
              )}
            </>
          )}
          {!snapshot.data && hasSnapshotError && (
            <p className="text-2xl font-semibold">Unavailable</p>
          )}
          {!snapshot.data && !hasSnapshotError && <Skeleton className="h-8 w-28" />}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-foreground-light">Provisioned disk size</p>
          <p className="text-2xl font-semibold">
            {canShowProvisioned ? `${project?.volumeSizeGb} GB` : 'Unavailable'}
          </p>
        </div>
        <div className="ml-auto">{diskAction}</div>
      </div>
      {snapshot.isPending && !isSelectionUnavailable && (
        <div role="status" className="space-y-3">
          <span className="text-sm text-foreground-light">Loading database objects...</span>
          <Skeleton className="h-80 w-full" />
        </div>
      )}
      {isSelectionUnavailable && (
        <AlertError
          subject="Failed to retrieve the selected database"
          error={
            databasesError ??
            new Error('The selected database is unavailable or has no read-only connection.')
          }
          projectRef={project?.ref}
        />
      )}
      {snapshot.isError && (
        <AlertError
          subject="Failed to retrieve database sizes"
          error={snapshot.error}
          projectRef={project?.ref}
        />
      )}
      {snapshot.isSuccess && (
        <>
          <p className="text-xs text-foreground-light">
            Space used covers all databases on the selected instance. The breakdown is a current
            snapshot of objects in <span className="font-mono">{snapshot.data.database_name}</span>{' '}
            ({formatBytes(snapshot.data.database_bytes)}), excluding system catalogs, sequences, and
            temporary objects. TOAST includes its indexes. The report date range applies to history
            only.
          </p>
          <DatabaseSizeCharts relations={snapshot.data.relations} metric={metric} />
          <DatabaseSizeTable relations={snapshot.data.relations} />
        </>
      )}
      {startDate && endDate && (
        <div className="space-y-2">
          <LazyComposedChartHandler
            id="database-size-history"
            label="Database size over time"
            attributes={[
              {
                attribute: 'pg_database_size',
                provider: 'infra-monitoring',
                label: 'Total',
                format: 'bytes',
                color: 'var(--chart-1)',
              },
            ]}
            startDate={startDate}
            endDate={endDate}
            interval={interval}
            updateDateRange={updateDateRange}
            format="bytes"
            showTooltip
            defaultChartStyle="line"
            YAxisProps={{ width: 65, tickFormatter: (value) => formatBytes(value, 1) }}
          />
          <p className="text-xs text-foreground-light">
            History shows total database usage on the selected instance. Object type history is
            unavailable.
          </p>
        </div>
      )}
    </section>
  )
}
