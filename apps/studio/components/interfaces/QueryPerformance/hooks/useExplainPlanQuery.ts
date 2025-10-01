import { useQuery } from '@tanstack/react-query'

import type { ExplainPlanRow } from 'components/ui/QueryPlan/types'
import { executeSql } from 'data/sql/execute-sql-query'

const QUERY_KEY = ['query-performance', 'explain-plan'] as const

const SELECT_ONLY_SAFE_STRICT_REGEX =
  /^(?![\s\S]*\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|call|do)\b)\s*(select\b|with\b[\s\S]*?\bselect\b)/i

export const getExplainValidationError = ({
  projectRef,
  sql,
}: {
  projectRef?: string | null
  sql: string
}): { id: string; title: string; message?: string } | null => {
  if (!projectRef || !sql) {
    return {
      id: 'missing-required-data',
      title: 'Missing required data',
      message: 'Project reference and SQL query are required.',
    }
  }

  if (!SELECT_ONLY_SAFE_STRICT_REGEX.test(sql)) {
    return {
      id: 'unsupported-query-type',
      title: 'Unsupported query type',
      message: 'Only SELECT queries are supported for EXPLAIN here.',
    }
  }

  if (/\$\d+/.test(sql)) {
    return {
      id: 'explain-not-run-for-parameterized-query',
      title: 'EXPLAIN not run for parameterized query',
      message: "We didn't run EXPLAIN because this query contains parameters (e.g. $1).",
    }
  }

  return null
}

export const useExplainPlanQuery = ({
  projectRef,
  connectionString,
  cleanedSql,
}: {
  projectRef?: string | null
  connectionString?: string | null
  cleanedSql: string
}) => {
  const validationError = getExplainValidationError({ projectRef, sql: cleanedSql })

  const query = useQuery(
    [...QUERY_KEY, projectRef, connectionString, cleanedSql],
    async ({ signal }) => {
      const explainSql = `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON) ${cleanedSql}`
      const { result } = await executeSql<ExplainPlanRow[]>(
        {
          projectRef: projectRef!,
          connectionString,
          sql: explainSql,
          queryKey: QUERY_KEY,
        },
        signal
      )

      return result ?? null
    },
    {
      enabled: !validationError,
      refetchOnWindowFocus: false,
      retry: false,
    }
  )

  return {
    ...query,
    validationError,
  }
}
