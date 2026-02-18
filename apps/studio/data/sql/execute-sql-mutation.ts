import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { sqlEventParser } from 'lib/sql-event-parser'
import { toast } from 'sonner'
import { UseCustomMutationOptions } from 'types'

import { ExecuteSqlData, ExecuteSqlVariables, executeSql } from './execute-sql-query'

// [Joshen] Intention is that we invalidate all database related keys whenever running a mutation related query
// So we attempt to ignore all the non-related query keys. We could probably look into grouping our query keys better
// actually to not make this too hacky here
const INVALIDATION_KEYS_IGNORE = ['branches', 'settings-v2', 'addons', 'custom-domains', 'content']

export type QueryResponseError = {
  code: string
  message: string
  error: string
  file: string
  length: number
  line: string
  name: string
  position: string
  routine: string
  severity: string
}

type ExecuteSqlMutationVariables = ExecuteSqlVariables & {
  autoLimit?: number
  contextualInvalidation?: boolean
}

export const useExecuteSqlMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ExecuteSqlData, QueryResponseError, ExecuteSqlMutationVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const { mutate: sendEvent } = useSendEventMutation()
  const { data: org } = useSelectedOrganizationQuery()

  return useMutation<ExecuteSqlData, QueryResponseError, ExecuteSqlMutationVariables>({
    mutationFn: (args) => executeSql(args),
    async onSuccess(data, variables, context) {
      const { contextualInvalidation, sql, projectRef } = variables

      // Track all table-related events from SQL execution
      try {
        const tableEvents = sqlEventParser.getTableEvents(sql)
        tableEvents.forEach((event) => {
          if (projectRef) {
            sendEvent({
              action: event.type,
              properties: {
                method: 'sql_editor',
                schema_name: event.schema,
                table_name: event.tableName,
              },
              groups: {
                project: projectRef,
                ...(org?.slug && { organization: org.slug }),
              },
            })
          }
        })
      } catch (error) {
        console.error('Failed to parse SQL for telemetry:', error)
      }

      // [Joshen] Default to false for now, only used for SQL editor to dynamically invalidate
      const sqlLower = sql.toLowerCase()
      const isMutationSQL =
        sqlLower.includes('create ') || sqlLower.includes('alter ') || sqlLower.includes('drop ')
      if (contextualInvalidation && projectRef && isMutationSQL) {
        const databaseRelatedKeys = queryClient
          .getQueryCache()
          .findAll({ queryKey: ['projects', projectRef] })
          .map((x) => x.queryKey)
          .filter((x) => !INVALIDATION_KEYS_IGNORE.some((a) => x.includes(a)))
        await Promise.all(
          databaseRelatedKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
        )
      }
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to execute SQL: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
