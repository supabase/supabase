import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import { useCallback } from 'react'

import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useFunctionLogsMigration } from '@/components/interfaces/Functions/useFunctionLogsMigration'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/invocations')({
  component: LogPage,
  staticData: {
    edgeFunctionDetailsTitle: 'Invocations',
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
    isInvocationsPage: true,
  })

  const shouldWaitForLogs =
    selectedFunction === undefined ||
    isLoading ||
    isLoadingPreview ||
    isMigrating ||
    (isUnifiedLogsEnabled && !shouldUseLegacyLogs)
  if (shouldWaitForLogs) return null

  return (
    <div className="flex-1">
      <LogsPreviewer
        condensedLayout
        projectRef={ref as string}
        queryType="fn_edge"
        filterOverride={{ 'request.pathname': `/functions/v1/${selectedFunction.slug}` }}
      />
    </div>
  )
}
