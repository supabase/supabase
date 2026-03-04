import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { advisorKeys } from './keys'
import { S, literal } from './advisors-fetch'
import type { AdvisorRule } from './types'

export function useAdvisorRulesQuery(
  projectRef?: string,
  options?: { category?: string; is_system?: boolean; enabled?: boolean }
) {
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useQuery<AdvisorRule[]>({
    queryKey: advisorKeys.rules(projectRef),
    queryFn: async ({ signal }) => {
      const clauses: string[] = []
      if (options?.category) clauses.push(`category = ${literal(options.category)}`)
      if (options?.is_system !== undefined) clauses.push(`is_system = ${literal(options.is_system)}`)
      const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

      const { result } = await executeSql<AdvisorRule[]>(
        {
          projectRef,
          connectionString,
          sql: `SELECT * FROM ${S}.rules ${where} ORDER BY is_system DESC, title`,
          queryKey: advisorKeys.rules(projectRef),
        },
        signal
      )
      return result ?? []
    },
    enabled: (options?.enabled ?? true) && !!projectRef && !!connectionString,
  })
}

export function useCreateRuleMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (body: Partial<AdvisorRule>) => {
      const { result } = await executeSql<AdvisorRule[]>({
        projectRef,
        connectionString,
        sql: `
          INSERT INTO ${S}.rules (
            name, title, description, category, source, sql_query,
            edge_function_name, api_endpoint, severity, level,
            schedule, cooldown_seconds, is_system, is_enabled,
            default_message, remediation, metadata
          ) VALUES (
            ${literal(body.name)}, ${literal(body.title)}, ${literal(body.description)},
            ${literal(body.category ?? 'general')}, ${literal(body.source ?? 'sql')},
            ${literal(body.sql_query)}, ${literal(body.edge_function_name)},
            ${literal(body.api_endpoint)}, ${literal(body.severity ?? 'warning')},
            ${literal(body.level ?? 'WARN')}, ${literal(body.schedule ?? '0 */6 * * *')},
            ${literal(body.cooldown_seconds ?? 3600)}, ${literal(body.is_system ?? false)},
            ${literal(body.is_enabled ?? true)}, ${literal(body.default_message)},
            ${literal(body.remediation)}, ${literal(body.metadata ?? {})}
          ) RETURNING *
        `,
        queryKey: ['advisor-create-rule'],
      })
      return result?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.rules(projectRef) })
    },
  })
}

export function useUpdateRuleMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (vars: { ruleId: string } & Partial<AdvisorRule>) => {
      const { ruleId, ...fields } = vars
      const setClauses: string[] = []

      const updatableFields: (keyof AdvisorRule)[] = [
        'name', 'title', 'description', 'category', 'source', 'sql_query',
        'edge_function_name', 'api_endpoint', 'severity', 'level', 'schedule',
        'cooldown_seconds', 'is_system', 'is_enabled', 'default_message',
        'remediation', 'metadata',
      ]

      for (const key of updatableFields) {
        if (key in fields) {
          setClauses.push(`${key} = ${literal(fields[key])}`)
        }
      }

      if (setClauses.length === 0) throw new Error('No fields to update')

      const { result } = await executeSql<AdvisorRule[]>({
        projectRef,
        connectionString,
        sql: `UPDATE ${S}.rules SET ${setClauses.join(', ')} WHERE id = ${literal(ruleId)} RETURNING *`,
        queryKey: ['advisor-update-rule'],
      })
      return result?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.rules(projectRef) })
    },
  })
}

export function useDeleteRuleMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (ruleId: string) => {
      await executeSql({
        projectRef,
        connectionString,
        sql: `DELETE FROM ${S}.rules WHERE id = ${literal(ruleId)} AND is_system = false`,
        queryKey: ['advisor-delete-rule'],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.rules(projectRef) })
    },
  })
}
