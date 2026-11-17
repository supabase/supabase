import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import { useCallback, useMemo } from 'react'

import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import {
  EDGE_FUNCTION_LOGS_VIEW,
  getEdgeFunctionLogsScope,
} from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview.utils'
import { useFunctionLogsMigration } from '@/components/interfaces/Functions/useFunctionLogsMigration'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { UnifiedLogs } from '@/components/interfaces/UnifiedLogs/UnifiedLogs'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/logs')({
  component: LogPage,
  staticData: {
    edgeFunctionDetailsTitle: 'Logs',
  },
})

function LogPage() {
  const { href: asPath } = useLocation()
  const navigate = useNavigate()
  const { ref, functionSlug } = useParams()
  const { isEnabled: isUnifiedLogsEnabled, isLoading: isLoadingPreview } = useUnifiedLogsPreview()

  const { data: selectedFunction, isPending: isLoading } = useEdgeFunctionQuery({
    projectRef: ref,
    slug: functionSlug,
  })
  const functionId = selectedFunction?.id
  const scope = useMemo(
    () => (functionId ? getEdgeFunctionLogsScope(functionId) : undefined),
    [functionId]
  )

  const handleReplace = useCallback(
    (url: string) => void navigate({ href: url, replace: true }),
    [navigate]
  )

  const { isMigrating, shouldUseLegacyLogs } = useFunctionLogsMigration({
    asPath,
    onReplace: handleReplace,
    projectRef: ref,
    functionSlug,
    isEnabled: isUnifiedLogsEnabled,
    isLoading: isLoadingPreview,
  })

  if (selectedFunction === undefined || isLoading || isLoadingPreview || isMigrating) return null

  if (isUnifiedLogsEnabled && !shouldUseLegacyLogs) {
    return (
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <UnifiedLogs scope={scope} hasFilterSideBar={false} {...EDGE_FUNCTION_LOGS_VIEW} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <LogsPreviewer
        condensedLayout
        projectRef={ref as string}
        queryType="functions"
        filterOverride={{ 'metadata.function_id': selectedFunction.id }}
      />
    </div>
  )
}
