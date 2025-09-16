import { type PropsWithChildren, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

import type { ExplainPlanRow } from 'components/ui/QueryPlan/types'
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

const getExplainValidationError = ({
  projectRef,
  sql,
}: {
  projectRef?: string | null
  sql: string
}): { title: string; message?: string } | null => {
  if (!projectRef || !sql) {
    return {
      title: 'Missing required data',
      message: 'Project reference and SQL query are required.',
    }
  }

  if (!SELECT_ONLY_SAFE_STRICT_REGEX.test(sql)) {
    return {
      title: 'Unsupported query type',
      message: 'Only SELECT queries are supported for EXPLAIN here.',
    }
  }

  if (/\$\d+/.test(sql)) {
    return {
      title: 'EXPLAIN not run for parameterized query',
      message: "We didn't run EXPLAIN because this query contains parameters (e.g. $1).",
    }
  }

  return null
}

export const QueryPlan = ({ query }: { query: string }) => {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref
  const connectionString = project?.connectionString

  const [isExecutingExplain, setIsExecutingExplain] = useState(false)
  const [explainError, setExplainError] = useState<{ title: string; message?: string } | null>(null)
  const [rawExplainResult, setRawExplainResult] = useState<ExplainPlanRow[] | null>(null)

  const cleanedSql = useMemo(() => {
    const cleanedSql = removeCommentsFromSql(query)
    const normalized = cleanedSql.replace(/\s+/g, ' ').trim()
    return normalized.replace(/;\s*$/, '')
  }, [query])

  /**
   * TODO: We should use sql parser like `@supabase/pg-parser` in this file when it's ready for Next.js
   */
  useEffect(() => {
    setRawExplainResult(null)
    const validationError = getExplainValidationError({
      projectRef,
      connectionString,
      sql: cleanedSql,
    })

    setExplainError(validationError)
    if (validationError) {
      setIsExecutingExplain(false)
      return
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

    const run = async () => {
      try {
        setIsExecutingExplain(true)

        const explainSql = `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON) ${cleanedSql}`
        const { result } = await executeSql<ExplainPlanRow[]>({
          projectRef,
          connectionString,
          sql: explainSql,
          queryKey: ['query-performance', 'explain-plan'],
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

    run()
  }, [projectRef, connectionString, cleanedSql])

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
      {isExecutingExplain && <GenericSkeletonLoader />}
      {explainJsonString && (
        <div className="h-[420px]">
          <QueryPlanVisualizer json={explainJsonString} className="h-full" />
        </div>
      )}
    </>
  )
}
