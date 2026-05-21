import { useParams } from 'common'

import { getEdgeFunctionDetailsPageLayout } from './layout'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import type { NextPageWithLayout } from '@/types'

export const LogPage: NextPageWithLayout = () => {
  const { ref, functionSlug } = useParams()

  const { data: selectedFunction, isPending: isLoading } = useEdgeFunctionQuery({
    projectRef: ref,
    slug: functionSlug,
  })

  if (selectedFunction === undefined || isLoading) return null

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

LogPage.getLayout = getEdgeFunctionDetailsPageLayout

export default LogPage
