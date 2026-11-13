import { useParams } from 'common'
import type { ReactNode } from 'react'

import { LogOverview } from '../ServiceFlow/LogOverview'
import { getLogDataForMetadataVisibility } from '../ServiceFlowPanel.utils'
import { addLogsFilter, logAttributeFilterId } from '../UnifiedLogs.filters'
import { ColumnSchema } from '../UnifiedLogs.schema'
import { QuerySearchParamsType } from '../UnifiedLogs.types'
import { getRawLogData } from '../UnifiedLogs.utils'
import { useLogEnrichment } from './useLogEnrichment'
import { AlertError } from '@/components/ui/AlertError'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { RawJsonView } from '@/components/ui/RawJsonView'
import { useUnifiedLogsBackend } from '@/data/logs/unified-logs-infinite-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export function LogDetail({
  row,
  tab,
  searchParameters,
  overviewHeader,
}: {
  row: ColumnSchema
  tab: 'overview' | 'raw-json'
  searchParameters: QuerySearchParamsType
  overviewHeader?: ReactNode
}) {
  const { ref: projectRef } = useParams()
  const { table, filterFields } = useDataTable<ColumnSchema, unknown>()
  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])
  const isOtel = useUnifiedLogsBackend(searchParameters)
  // The panel header shows a spinner while this loads, so the details don't shift when it ends
  const { enrichedData, attributes, isLoading, error } = useLogEnrichment({ row, searchParameters })

  const baseData = enrichedData ?? (attributes ? { ...row, metadata: attributes } : row)
  const rawData = getLogDataForMetadataVisibility(getRawLogData(baseData), logsMetadata)

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
      {tab === 'raw-json' && <RawJsonView data={rawData} copyLabel="Copy log as JSON" />}
      {tab === 'overview' && (
        <LogOverview
          header={overviewHeader}
          attributes={attributes}
          onAddAttributeFilter={
            isOtel
              ? (key, value, operator) =>
                  addLogsFilter(table, { field: logAttributeFilterId(key), operator, value })
              : undefined
          }
          data={row}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />
      )}
    </div>
  )
}
