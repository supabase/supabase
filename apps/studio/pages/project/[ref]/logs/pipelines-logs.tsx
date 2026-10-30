import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { LogPage as LegacyLogPage } from './replication-logs'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { UnifiedLogs } from '@/components/interfaces/UnifiedLogs/UnifiedLogs'
import type { UnifiedLogsScope } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import type { NextPageWithLayout } from '@/types'

const PIPELINES_LOGS_SCOPE: UnifiedLogsScope = {
  filters: [{ column: 'log_type', operator: '=', value: 'pipelines' }],
}

export const LogPage: NextPageWithLayout = () => {
  const { isEnabled, isLoading } = useUnifiedLogsPreview()
  if (isLoading) return <GenericSkeletonLoader />
  if (!isEnabled) return <LegacyLogPage dehydratedState={undefined} />

  return (
    <UnifiedLogs
      scope={PIPELINES_LOGS_SCOPE}
      hasFilterSideBar={false}
      offeredFilters={['date', 'level', 'pipeline_id', 'event_message']}
      columnPreferencesKey="pipelines"
    />
  )
}

LogPage.getLayout = LegacyLogPage.getLayout

export default LogPage
