import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { advisorKeys } from './keys'
import { S, literal } from './advisors-fetch'
import type { AdvisorChannel } from './types'

export function useAdvisorChannelsQuery(
  projectRef?: string,
  options?: { enabled?: boolean }
) {
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useQuery<AdvisorChannel[]>({
    queryKey: advisorKeys.channels(projectRef),
    queryFn: async ({ signal }) => {
      const { result } = await executeSql<AdvisorChannel[]>(
        {
          projectRef,
          connectionString,
          sql: `SELECT * FROM ${S}.channels ORDER BY name`,
          queryKey: advisorKeys.channels(projectRef),
        },
        signal
      )
      return result ?? []
    },
    enabled: (options?.enabled ?? true) && !!projectRef && !!connectionString,
  })
}

export function useCreateChannelMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (body: Partial<AdvisorChannel>) => {
      const { result } = await executeSql<AdvisorChannel[]>({
        projectRef,
        connectionString,
        sql: `
          INSERT INTO ${S}.channels (type, name, config, severity_filter, category_filter, is_enabled)
          VALUES (
            ${literal(body.type)},
            ${literal(body.name)},
            ${literal(body.config ?? {})},
            ${literal(body.severity_filter ?? ['critical', 'warning'])},
            ${body.category_filter ? literal(body.category_filter) : 'NULL'},
            ${literal(body.is_enabled ?? true)}
          ) RETURNING *
        `,
        queryKey: ['advisor-create-channel'],
      })
      return result?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.channels(projectRef) })
    },
  })
}

export function useUpdateChannelMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (vars: { channelId: string } & Partial<AdvisorChannel>) => {
      const { channelId, ...fields } = vars
      const setClauses: string[] = []

      if (fields.name !== undefined) setClauses.push(`name = ${literal(fields.name)}`)
      if (fields.type !== undefined) setClauses.push(`type = ${literal(fields.type)}`)
      if (fields.config !== undefined) setClauses.push(`config = ${literal(fields.config)}`)
      if (fields.severity_filter !== undefined) setClauses.push(`severity_filter = ${literal(fields.severity_filter)}`)
      if (fields.category_filter !== undefined) {
        setClauses.push(`category_filter = ${fields.category_filter ? literal(fields.category_filter) : 'NULL'}`)
      }
      if (fields.is_enabled !== undefined) setClauses.push(`is_enabled = ${literal(fields.is_enabled)}`)

      if (setClauses.length === 0) throw new Error('No fields to update')

      const { result } = await executeSql<AdvisorChannel[]>({
        projectRef,
        connectionString,
        sql: `UPDATE ${S}.channels SET ${setClauses.join(', ')} WHERE id = ${literal(channelId)} RETURNING *`,
        queryKey: ['advisor-update-channel'],
      })
      return result?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.channels(projectRef) })
    },
  })
}

export function useDeleteChannelMutation(projectRef?: string) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation({
    mutationFn: async (channelId: string) => {
      await executeSql({
        projectRef,
        connectionString,
        sql: `DELETE FROM ${S}.channels WHERE id = ${literal(channelId)}`,
        queryKey: ['advisor-delete-channel'],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advisorKeys.channels(projectRef) })
    },
  })
}
