import { useParams } from 'common'

import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { UnifiedLogs } from '@/components/interfaces/UnifiedLogs/UnifiedLogs'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import type { NextPageWithLayout } from '@/types'

export const LogPage: NextPageWithLayout = () => {
  const { ref, functionSlug } = useParams()
  const { isEnabled: isUnifiedLogsEnabled, isLoading: isLoadingPreview } = useUnifiedLogsPreview()

  const { data: selectedFunction, isPending: isLoading } = useEdgeFunctionQuery({
    projectRef: ref,
    slug: functionSlug,
  })

  if (selectedFunction === undefined || isLoading || isLoadingPreview) return null

  if (isUnifiedLogsEnabled) {
    return (
      // The logs table sizes itself to its parent, so pin it to the space left below the tabs
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <UnifiedLogs scope={{ functionId: selectedFunction.id }} />
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

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout title="Logs">{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default LogPage
