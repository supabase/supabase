import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { advisorKeys } from './keys'
import { S, literal } from './advisors-fetch'
import type { AdvisorIssue, AdvisorIssueDetail, AdvisorAlert, AdvisorConversation, IssueStatus } from './types'

export function useAdvisorIssuesQuery(
  projectRef?: string,
  options?: { status?: string; category?: string; severity?: string; enabled?: boolean }
) {
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useQuery<AdvisorIssue[]>({
    queryKey: advisorKeys.issues(projectRef),
    queryFn: async ({ signal }) => {
      const clauses: string[] = []
      if (options?.status) clauses.push(`status = ${literal(options.status)}`)
      if (options?.category) clauses.push(`category = ${literal(options.category)}`)
      if (options?.severity) clauses.push(`severity = ${literal(options.severity)}`)
      const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

      const { result } = await executeSql<AdvisorIssue[]>(
        {
          projectRef,
          connectionString,
          sql: `SELECT * FROM ${S}.issues ${where} ORDER BY last_triggered_at DESC`,
          queryKey: advisorKeys.issues(projectRef),
        },
        signal
      )
      return result ?? []
    },
    enabled: (options?.enabled ?? true) && !!projectRef && !!connectionString,
  })
}

export function useAdvisorIssueDetailQuery(projectRef?: string, issueId?: string) {
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useQuery<AdvisorIssueDetail>({
    queryKey: advisorKeys.issue(projectRef, issueId),
    queryFn: async ({ signal }) => {
      const { result: issues } = await executeSql<AdvisorIssue[]>(
        {
          projectRef,
          connectionString,
          sql: `SELECT * FROM ${S}.issues WHERE id = ${literal(issueId)}`,
          queryKey: ['advisor-issue', issueId],
        },
        signal
      )

      if (!issues || issues.length === 0) throw new Error('Issue not found')
      const issue = issues[0]

      const { result: alerts } = await executeSql<AdvisorAlert[]>(
        {
          projectRef,
          connectionString,
          sql: `SELECT * FROM ${S}.alerts WHERE issue_id = ${literal(issueId)} ORDER BY triggered_at DESC`,
          queryKey: ['advisor-issue-alerts', issueId],
        },
        signal
      )

      const { result: conversations } = await executeSql<AdvisorConversation[]>(
        {
          projectRef,
          connectionString,
          sql: `
            SELECT c.*,
              COALESCE(
                (SELECT json_agg(cm ORDER BY cm.created_at)
                 FROM ${S}.conversation_messages cm
                 WHERE cm.conversation_id = c.id),
                '[]'::json
              ) as messages
            FROM ${S}.conversations c
            WHERE c.issue_id = ${literal(issueId)}
            ORDER BY c.created_at DESC
          `,
          queryKey: ['advisor-issue-conversations', issueId],
        },
        signal
      )

      return {
        ...issue,
        alerts: alerts ?? [],
        conversations: conversations ?? [],
      }
    },
    enabled: !!projectRef && !!issueId && !!connectionString,
  })
}

export function useUpdateIssueMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (vars: {
      issueId: string
      status?: IssueStatus
      snoozed_until?: string
      assigned_to?: string
      resolved_by?: string
    }) => {
      const { issueId, ...fields } = vars
      const setClauses: string[] = []
      if (fields.status !== undefined) {
        setClauses.push(`status = ${literal(fields.status)}`)
        if (fields.status === 'resolved') {
          setClauses.push(`resolved_at = now()`)
        }
      }
      if (fields.snoozed_until !== undefined) setClauses.push(`snoozed_until = ${literal(fields.snoozed_until)}`)
      if (fields.assigned_to !== undefined) setClauses.push(`assigned_to = ${literal(fields.assigned_to)}`)
      if (fields.resolved_by !== undefined) setClauses.push(`resolved_by = ${literal(fields.resolved_by)}`)

      if (setClauses.length === 0) throw new Error('No fields to update')

      const { result } = await executeSql<AdvisorIssue[]>({
        projectRef,
        connectionString,
        sql: `UPDATE ${S}.issues SET ${setClauses.join(', ')} WHERE id = ${literal(issueId)} RETURNING *`,
        queryKey: ['advisor-update-issue'],
      })
      return result?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.issues(projectRef) })
    },
  })
}
