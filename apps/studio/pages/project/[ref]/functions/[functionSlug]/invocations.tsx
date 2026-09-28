import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { getEdgeFunctionLogsUrl } from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview.utils'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import type { NextPageWithLayout } from '@/types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, functionSlug, its, ite, log } = useParams()
  const { isEnabled: isUnifiedLogsEnabled, isLoading: isLoadingPreview } = useUnifiedLogsPreview()

  const { data: selectedFunction, isPending: isLoading } = useEdgeFunctionQuery({
    projectRef: ref,
    slug: functionSlug,
  })

  // Unified logs merge invocations into the Logs tab, so keep old links working by forwarding
  // their time range and selected log
  const shouldRedirectToLogs = isUnifiedLogsEnabled && !!ref && !!functionSlug
  useEffect(() => {
    if (!shouldRedirectToLogs) return
    router.replace(
      getEdgeFunctionLogsUrl({
        projectRef: ref,
        functionSlug,
        start: its,
        end: ite,
        logId: log,
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRedirectToLogs])

  if (selectedFunction === undefined || isLoading || isLoadingPreview || shouldRedirectToLogs) {
    return null
  }

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

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout title="Invocations">{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default LogPage
