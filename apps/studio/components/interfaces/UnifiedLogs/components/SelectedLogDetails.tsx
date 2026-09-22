import { memo, useState } from 'react'
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from 'ui'

import { getLogDataForMetadataVisibility } from '../ServiceFlowPanel.utils'
import { ColumnSchema } from '../UnifiedLogs.schema'
import { QuerySearchParamsType } from '../UnifiedLogs.types'
import { getRawLogData } from '../UnifiedLogs.utils'
import { LogDetail } from './LogDetail'
import { LogJsonPreview } from './LogJsonPreview'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

const PREVIEW_LOG_LIMIT = 20

// This boundary lets selection and keyboard controls commit before the preview.
export const SelectedLogDetails = memo(function SelectedLogDetails({
  rows,
  searchParameters,
}: {
  rows: ColumnSchema[]
  searchParameters: QuerySearchParamsType
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])

  if (rows.length > 1) {
    const preview = rows
      .slice(0, PREVIEW_LOG_LIMIT)
      .map((row) => getLogDataForMetadataVisibility(getRawLogData(row), logsMetadata))
    const json = JSON.stringify(preview, null, 2)
    return (
      <div className="min-h-0 flex-1 overflow-auto" role="region" aria-label="Selected logs JSON">
        <LogJsonPreview json={json} isPartial={rows.length > PREVIEW_LOG_LIMIT} />
      </div>
    )
  }

  const row = rows[0]
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
      <TabsList className="shrink-0 gap-x-4 px-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="raw-json">Raw JSON</TabsTrigger>
        <TabsIndicator />
      </TabsList>
      {['overview', 'raw-json'].map((tab) => (
        <TabsContent key={tab} value={tab} className="mt-0 min-h-0 flex-1 overflow-auto">
          {row && <LogDetail row={row} tab={tab} searchParameters={searchParameters} />}
        </TabsContent>
      ))}
    </Tabs>
  )
})
