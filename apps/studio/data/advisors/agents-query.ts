import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { advisorKeys } from './keys'
import { S, literal } from './advisors-fetch'
import type { AdvisorAgent, AdvisorAgentTask } from './types'

export function useAdvisorAgentsQuery(
  projectRef?: string,
  options?: { enabled?: boolean }
) {
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useQuery<AdvisorAgent[]>({
    queryKey: advisorKeys.agents(projectRef),
    queryFn: async ({ signal }) => {
      const { result } = await executeSql<AdvisorAgent[]>(
        {
          projectRef,
          connectionString,
          sql: `SELECT * FROM ${S}.agents ORDER BY name`,
          queryKey: advisorKeys.agents(projectRef),
        },
        signal
      )
      return result ?? []
    },
    enabled: (options?.enabled ?? true) && !!projectRef && !!connectionString,
  })
}

export function useCreateAgentMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (body: Partial<AdvisorAgent>) => {
      const { result } = await executeSql<AdvisorAgent[]>({
        projectRef,
        connectionString,
        sql: `
          INSERT INTO ${S}.agents (name, summary, system_prompt, tools)
          VALUES (
            ${literal(body.name)},
            ${literal(body.summary)},
            ${literal(body.system_prompt)},
            ${literal(body.tools ?? [])}
          ) RETURNING *
        `,
        queryKey: ['advisor-create-agent'],
      })
      return result?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.agents(projectRef) })
    },
  })
}

export function useUpdateAgentMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (vars: { agentId: string } & Partial<AdvisorAgent>) => {
      const { agentId, ...fields } = vars
      const setClauses: string[] = []

      if (fields.name !== undefined) setClauses.push(`name = ${literal(fields.name)}`)
      if (fields.summary !== undefined) setClauses.push(`summary = ${literal(fields.summary)}`)
      if (fields.system_prompt !== undefined) setClauses.push(`system_prompt = ${literal(fields.system_prompt)}`)
      if (fields.tools !== undefined) setClauses.push(`tools = ${literal(fields.tools)}`)

      if (setClauses.length === 0) throw new Error('No fields to update')

      const { result } = await executeSql<AdvisorAgent[]>({
        projectRef,
        connectionString,
        sql: `UPDATE ${S}.agents SET ${setClauses.join(', ')} WHERE id = ${literal(agentId)} RETURNING *`,
        queryKey: ['advisor-update-agent'],
      })
      return result?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.agents(projectRef) })
    },
  })
}

export function useDeleteAgentMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (agentId: string) => {
      await executeSql({
        projectRef,
        connectionString,
        sql: `DELETE FROM ${S}.agents WHERE id = ${literal(agentId)}`,
        queryKey: ['advisor-delete-agent'],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.agents(projectRef) })
    },
  })
}

// Agent Tasks

export function useAdvisorAgentTasksQuery(
  projectRef?: string,
  options?: { agentId?: string; enabled?: boolean }
) {
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useQuery<AdvisorAgentTask[]>({
    queryKey: advisorKeys.agentTasks(projectRef),
    queryFn: async ({ signal }) => {
      const where = options?.agentId
        ? `WHERE agent_id = ${literal(options.agentId)}`
        : ''

      const { result } = await executeSql<AdvisorAgentTask[]>(
        {
          projectRef,
          connectionString,
          sql: `SELECT * FROM ${S}.agent_tasks ${where} ORDER BY name`,
          queryKey: advisorKeys.agentTasks(projectRef),
        },
        signal
      )
      return result ?? []
    },
    enabled: (options?.enabled ?? true) && !!projectRef && !!connectionString,
  })
}

export function useCreateAgentTaskMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (body: Partial<AdvisorAgentTask>) => {
      const { result } = await executeSql<AdvisorAgentTask[]>({
        projectRef,
        connectionString,
        sql: `
          INSERT INTO ${S}.agent_tasks (agent_id, name, description, schedule, is_unique, enabled)
          VALUES (
            ${literal(body.agent_id)},
            ${literal(body.name)},
            ${literal(body.description)},
            ${literal(body.schedule)},
            ${literal(body.is_unique ?? false)},
            ${literal(body.enabled ?? true)}
          ) RETURNING *
        `,
        queryKey: ['advisor-create-agent-task'],
      })
      return result?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.agentTasks(projectRef) })
    },
  })
}

export function useUpdateAgentTaskMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (vars: { taskId: string } & Partial<AdvisorAgentTask>) => {
      const { taskId, ...fields } = vars
      const setClauses: string[] = []

      if (fields.name !== undefined) setClauses.push(`name = ${literal(fields.name)}`)
      if (fields.description !== undefined) setClauses.push(`description = ${literal(fields.description)}`)
      if (fields.schedule !== undefined) setClauses.push(`schedule = ${literal(fields.schedule)}`)
      if (fields.is_unique !== undefined) setClauses.push(`is_unique = ${literal(fields.is_unique)}`)
      if (fields.enabled !== undefined) setClauses.push(`enabled = ${literal(fields.enabled)}`)

      if (setClauses.length === 0) throw new Error('No fields to update')

      const { result } = await executeSql<AdvisorAgentTask[]>({
        projectRef,
        connectionString,
        sql: `UPDATE ${S}.agent_tasks SET ${setClauses.join(', ')} WHERE id = ${literal(taskId)} RETURNING *`,
        queryKey: ['advisor-update-agent-task'],
      })
      return result?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.agentTasks(projectRef) })
    },
  })
}

export function useDeleteAgentTaskMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (taskId: string) => {
      await executeSql({
        projectRef,
        connectionString,
        sql: `DELETE FROM ${S}.agent_tasks WHERE id = ${literal(taskId)}`,
        queryKey: ['advisor-delete-agent-task'],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.agentTasks(projectRef) })
    },
  })
}
