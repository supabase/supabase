import { useParams } from 'common'
import { useRouter } from 'next/router'

import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useFunctionLogsMigration } from '@/components/interfaces/Functions/useFunctionLogsMigration'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import type { NextPageWithLayout } from '@/types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, functionSlug } = useParams()
  const { isEnabled: isUnifiedLogsEnabled, isLoading: isLoadingPreview } = useUnifiedLogsPreview()

  const { data: selectedFunction, isPending: isLoading } = useEdgeFunctionQuery({
    projectRef: ref,
    slug: functionSlug,
  })

  const { isMigrating, shouldUseLegacyLogs } = useFunctionLogsMigration({
    asPath: router.asPath,
    onReplace: router.replace,
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

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout title="Invocations">{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default LogPage
