import { useParams } from 'common'
import { useRouter } from 'next/router'

import { FunctionObservabilityDisabled } from '@/components/interfaces/Functions/FunctionObservabilityDisabled'
import { useFunctionLogsMigration } from '@/components/interfaces/Functions/useFunctionLogsMigration'
import { useFunctionObservability } from '@/components/interfaces/Functions/useFunctionObservability'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import { AlertError } from '@/components/ui/AlertError'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import type { NextPageWithLayout } from '@/types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, functionSlug } = useParams()
  const {
    isEnabled: isUnifiedLogsEnabled,
    isLoading: isLoadingPreview,
    isAvailable,
    error: observabilityError,
  } = useFunctionObservability()

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

  if (observabilityError)
    return <AlertError error={observabilityError} subject="Failed to load logging configuration" />
  if (!isLoadingPreview && !isAvailable) return <FunctionObservabilityDisabled />

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
