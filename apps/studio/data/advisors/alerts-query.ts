import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { advisorKeys } from './keys'
import { S, literal } from './advisors-fetch'
import type { AdvisorAlert } from './types'

export function useAdvisorAlertsQuery(
  projectRef?: string,
  options?: { issueId?: string; ruleId?: string; enabled?: boolean }
) {
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useQuery<AdvisorAlert[]>({
    queryKey: advisorKeys.alerts(projectRef, options?.issueId),
    queryFn: async ({ signal }) => {
      const clauses: string[] = []
      if (options?.issueId) clauses.push(`issue_id = ${literal(options.issueId)}`)
      if (options?.ruleId) clauses.push(`rule_id = ${literal(options.ruleId)}`)
      const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

      const { result } = await executeSql<AdvisorAlert[]>(
        {
          projectRef,
          connectionString,
          sql: `SELECT * FROM ${S}.alerts ${where} ORDER BY triggered_at DESC LIMIT 500`,
          queryKey: advisorKeys.alerts(projectRef, options?.issueId),
        },
        signal
      )
      return result ?? []
    },
    enabled: (options?.enabled ?? true) && !!projectRef && !!connectionString,
  })
}

export type ExecuteRuleResult = {
  status: string
  rowCount?: number
}

function parseExecuteRuleResult(raw: string): ExecuteRuleResult {
  if (raw.startsWith('alert_created:')) {
    return { status: 'alert_created', rowCount: parseInt(raw.split(':')[1], 10) }
  }
  if (raw.startsWith('cooldown:')) {
    return { status: 'cooldown', rowCount: parseInt(raw.split(':')[1], 10) }
  }
  return { status: raw }
}

export function useExecuteRuleMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (ruleId: string): Promise<ExecuteRuleResult> => {
      const { result } = await executeSql<{ execute_rule: string }[]>({
        projectRef,
        connectionString,
        sql: `SELECT ${S}.execute_rule(${literal(ruleId)}::uuid, true)`,
        queryKey: ['advisor-execute-rule', ruleId],
      })
      const raw = result?.[0]?.execute_rule ?? 'unknown'
      return parseExecuteRuleResult(raw)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.alerts(projectRef) })
      queryClient.invalidateQueries({ queryKey: advisorKeys.issues(projectRef) })
    },
  })
}
