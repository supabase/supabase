'use client'

import { useParams } from 'common'
import { LogsPreviewer } from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'

/** Shared body of `pages/project/[ref]/functions/[functionSlug]/invocations.tsx`. */
export function EdgeFunctionInvocationsPageContent() {
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
        queryType="fn_edge"
        filterOverride={{ function_id: selectedFunction.id }}
      />
    </div>
  )
}
