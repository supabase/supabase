import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { detectLogSource } from '@/data/logs/logs-sql-rewrite'
import { otelLogKeysQueryOptions } from '@/data/logs/otel-log-keys-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

/**
 * Looks up the real `log_attributes` keys for whichever source a logs query
 * targets. The AI flows pass these along so the model uses exact dotted paths
 * instead of inventing them.
 *
 * Deliberately imperative: discovery aggregates a week of logs, and the source is
 * derived from query text the user is editing, so anything reactive fires requests
 * for half-typed source names. Fetching at submit time means one request per
 * action the user actually took. It still goes through the query client, so a
 * result already cached for that source (by an earlier submit, or by a component
 * subscribed via `useOtelLogKeysQuery`) is reused rather than refetched.
 *
 * Keys are an enhancement, never a requirement — a failed or impossible lookup
 * resolves to `undefined` and the caller proceeds without them.
 */
export function useLogsAttributeKeys() {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref

  const fetchAttributeKeys = useCallback(
    async (sql: string): Promise<string[] | undefined> => {
      const source = detectLogSource(sql)
      if (!projectRef || source === undefined) return undefined

      try {
        return await queryClient.fetchQuery(otelLogKeysQueryOptions({ projectRef, source }))
      } catch {
        return undefined
      }
    },
    [projectRef, queryClient]
  )

  return { fetchAttributeKeys }
}
