import { useParams } from 'common'
import { Skeleton } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { LogOverview } from '../ServiceFlow/LogOverview'
import { getLogDataForMetadataVisibility } from '../ServiceFlowPanel.utils'
import { ColumnSchema } from '../UnifiedLogs.schema'
import { QuerySearchParamsType } from '../UnifiedLogs.types'
import { getRawLogData, getRowTimestampMs } from '../UnifiedLogs.utils'
import { AlertError } from '@/components/ui/AlertError'
import CopyButton from '@/components/ui/CopyButton'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import {
  SERVICE_FLOW_TYPES,
  useUnifiedLogInspectionQuery,
} from '@/data/logs/unified-log-inspection-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export function LogDetail({
  row,
  tab,
  searchParameters,
}: {
  row: ColumnSchema
  tab: string
  searchParameters: QuerySearchParamsType
}) {
  const { ref: projectRef } = useParams()
  const { table, filterFields } = useDataTable<ColumnSchema, unknown>()
  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])
  const normalizedType = row.log_type === 'edge function' ? 'edge-function' : row.log_type
  const serviceFlowType = SERVICE_FLOW_TYPES.find((type) => type === normalizedType)
  const { data, isPending, error } = useUnifiedLogInspectionQuery(
    {
      projectRef,
      logId: row.id,
      type: serviceFlowType,
      search: searchParameters,
      logTimestampMs: getRowTimestampMs(row),
    },
    { enabled: !!serviceFlowType }
  )
  const isLoading = !!serviceFlowType && isPending
  const enrichedData = data?.result?.[0]
  const rawData = getLogDataForMetadataVisibility(getRawLogData(enrichedData ?? row), logsMetadata)

  if (tab === 'raw-json') {
    return (
      <>
        {isLoading && (
          <div className="flex items-center gap-3 p-3 text-foreground-light">
            <Skeleton className="h-4 w-4 rounded-full" />
            <span className="text-sm">Enriching log...</span>
          </div>
        )}
        <div className="sticky top-2 z-10 -mb-9 flex justify-end px-2 pointer-events-none">
          <CopyButton
            iconOnly
            aria-label="Copy log as JSON"
            variant="default"
            text={JSON.stringify(rawData, null, 2)}
            className="pointer-events-auto"
          />
        </div>
        <CodeBlock
          language="json"
          hideCopy
          wrapperClassName="!overflow-visible bg-surface-100/50 [&_pre]:!bg-surface-100/50"
          className="rounded-none border-none !overflow-x-visible [&_code]:!leading-tight [&_pre]:!leading-tight"
        >
          {JSON.stringify(rawData, null, 2)}
        </CodeBlock>
      </>
    )
  }

  return (
    <div className="py-2">
      {error && (
        <AlertError
          error={error}
          subject="Failed to retrieve log details"
          projectRef={projectRef}
          className="mx-4 mb-2"
        />
      )}
      <LogOverview
        data={row}
        enrichedData={enrichedData}
        rawData={rawData}
        isLoading={isLoading}
        filterFields={filterFields}
        table={table}
      />
    </div>
  )
}
