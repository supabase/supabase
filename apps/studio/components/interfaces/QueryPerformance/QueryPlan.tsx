import { type PropsWithChildren, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { executeSql } from 'data/sql/execute-sql-query'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, WarningIcon } from 'ui'
import { removeCommentsFromSql } from 'lib/helpers'

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

const SELECT_ONLY_SAFE_STRICT_REGEX =
  /^(?![\s\S]*\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|call|do)\b)\s*(select\b|with\b[\s\S]*?\bselect\b)/i

export const QueryPlan = ({ query }: { query: string }) => {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref
  const connectionString = project?.connectionString

  const [isExecutingExplain, setIsExecutingExplain] = useState(false)
  const [explainError, setExplainError] = useState<{ title: string; message?: string } | null>(null)
  const [rawExplainResult, setRawExplainResult] = useState<any[] | null>(null)

  const cleanedSql = useMemo(() => {
    const cleanedSql = removeCommentsFromSql(query)
    const normalized = cleanedSql.replace(/\s+/g, ' ').trim()
    return normalized.replace(/;\s*$/, '')
  }, [query])

  /**
   * TODO: We should use sql parser like `@supabase/pg-parser` in this file when it's ready for Next.js
   */
  useEffect(() => {
    if (!projectRef || !cleanedSql) {
      setExplainError({
        title: 'Missing required data',
        message: 'Project reference, connection string, and SQL query are required.',
      })

      return
    }

    const run = async () => {
      try {
        setIsExecutingExplain(true)
        setExplainError(null)
        setRawExplainResult(null)

        const explainSql = `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON) ${cleanedSql}`
        const { result } = await executeSql<any[]>({
          projectRef,
          connectionString,
          sql: explainSql,
          queryKey: ['query-performance', 'explain-plan', cleanedSql],
        })

        setRawExplainResult(result ?? null)
      } catch (e: any) {
        setExplainError({
          title: 'Failed to run EXPLAIN',
          message: e?.message ?? 'An unexpected error occurred.',
        })
      } finally {
        setIsExecutingExplain(false)
      }
    }

    const isSelectOrWithSelect = SELECT_ONLY_SAFE_STRICT_REGEX.test(cleanedSql)
    if (!isSelectOrWithSelect) {
      setExplainError({
        title: 'Unsupported query type',
        message: 'Only SELECT queries are supported for EXPLAIN here.',
      })

      return
    }

    const hasPositionalParams = /\$\d+/.test(cleanedSql)
    if (hasPositionalParams) {
      setExplainError({
        title: 'EXPLAIN not run for parameterized query',
        message: "We didn't run EXPLAIN because this query contains parameters (e.g. $1).",
      })

      return
    }

    run()
  }, [projectRef, connectionString, cleanedSql])

  const explainJsonString = useMemo(() => {
    if (!rawExplainResult || rawExplainResult.length === 0) return null
    const row = rawExplainResult[0]
    const value =
      (row && (row['QUERY PLAN'] ?? row['query plan'] ?? row.query_plan ?? row.queryPlan)) ?? null
    if (value == null) return null

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return JSON.stringify(parsed)
      } catch {
        return value
      }
    }
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
      {isExecutingExplain && <GenericSkeletonLoader />}
      {explainJsonString && (
        <div className="h-[420px]">
          <QueryPlanVisualizer json={explainJsonString} className="h-full" />
        </div>
      )}
    </>
  )
}
