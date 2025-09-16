import { type PropsWithChildren, useMemo } from 'react'
import dynamic from 'next/dynamic'

import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, WarningIcon } from 'ui'
import { removeCommentsFromSql } from 'lib/helpers'
import { useExplainPlanQuery } from './hooks/useExplainPlanQuery'

type WarningMessageProps = PropsWithChildren<{ title: string }>
const WarningMessage = ({ title, children }: WarningMessageProps) => {
  return (
    <div className="h-full flex items-center">
      <Alert_Shadcn_ variant="warning" className="w-full">
        <WarningIcon />
        <AlertTitle_Shadcn_>{title}</AlertTitle_Shadcn_>
        {children && <AlertDescription_Shadcn_>{children}</AlertDescription_Shadcn_>}
      </Alert_Shadcn_>
    </div>
  )
}

/**
 * Load the query plan visualizer client-side only (does not behave well server-side)
 * @reference apps/studio/components/interfaces/SQLEditor/SQLEditor.tsx
 */
const QueryPlanVisualizer = dynamic(
  () =>
    import('components/ui/QueryPlan/query-plan-visualizer').then(
      ({ QueryPlanVisualizer }) => QueryPlanVisualizer
    ),
  { ssr: false }
)

export const QueryPlan = ({ query }: { query: string }) => {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref
  const connectionString = project?.connectionString

  const cleanedSql = useMemo(() => {
    const cleanedSql = removeCommentsFromSql(query)
    const normalized = cleanedSql.replace(/\s+/g, ' ').trim()
    return normalized.replace(/;\s*$/, '')
  }, [query])

  const {
    data: rawExplainResult,
    error: queryError,
    isFetching,
    validationError,
  } = useExplainPlanQuery({
    projectRef,
    connectionString,
    cleanedSql,
  })

  const explainError = useMemo(() => {
    if (validationError) return validationError
    if (!queryError) return null

    const message =
      typeof queryError === 'object' && queryError !== null && 'message' in queryError
        ? (queryError as { message?: string }).message
        : undefined

    return {
      title: 'Failed to run EXPLAIN',
      message: message ?? 'An unexpected error occurred.',
    }
  }, [queryError, validationError])

  const explainJsonString = useMemo(() => {
    if (!rawExplainResult || rawExplainResult.length === 0) return null

    const value = rawExplainResult[0]['QUERY PLAN']
    if (!value) return null

    try {
      return JSON.stringify(value)
    } catch {
      return null
    }
  }, [rawExplainResult])

  return (
    <>
      <p className="text-sm">Execution plan</p>
      {explainError && (
        <WarningMessage title={explainError.title || 'Failed to run EXPLAIN'}>
          {explainError.message}
        </WarningMessage>
      )}
      {isFetching && <GenericSkeletonLoader />}
      {explainJsonString && (
        <div className="h-[420px]">
          <QueryPlanVisualizer json={explainJsonString} className="h-full" />
        </div>
      )}
    </>
  )
}
