import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseExtensionsKeys } from 'data/database-extensions/keys'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { databaseRoleKeys } from 'data/database-roles/keys'
import { databaseTriggerKeys } from 'data/database-triggers/keys'
import { databaseKeys } from 'data/database/keys'
import { entityTypeKeys } from 'data/entity-types/keys'
import { enumeratedTypesKeys } from 'data/enumerated-types/keys'
import { tableKeys } from 'data/tables/keys'
import { executeSql, ExecuteSqlData, ExecuteSqlVariables } from './execute-sql-query'

export type QueryResponseError = {
  code: string
  message: string
  error: string
  formattedError: string
  file: string
  length: number
  line: string
  name: string
  position: string
  routine: string
  severity: string
}

export const useExecuteSqlMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ExecuteSqlData, QueryResponseError, ExecuteSqlVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<ExecuteSqlData, QueryResponseError, ExecuteSqlVariables>(
    (args) => executeSql(args),
    {
      async onSuccess(data, variables, context) {
        const { contextualInvalidation, sql, projectRef } = variables

        // [Joshen] Default to false for now, only used for SQL editor to dynamically invalidate
        if (contextualInvalidation && projectRef) {
          const invalidationKeys = inferInvalidationKeys(projectRef, sql)
          console.log({ invalidationKeys })
          await Promise.all(invalidationKeys.map((key) => queryClient.invalidateQueries(key)))
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
    }
  )
}

// [Joshen] Can expand this further eventually, but just covering certain easy cases for now
const inferInvalidationKeys = (ref: string, sql: string) => {
  const keys = []
  const sqlLower = sql.toLowerCase()

  if (
    sqlLower.includes('create table') ||
    sqlLower.includes('alter table') ||
    sqlLower.includes('drop table')
  ) {
    keys.push(entityTypeKeys.list(ref))
    keys.push(tableKeys.list(ref))
  }
  if (
    sqlLower.includes('create schema') ||
    sqlLower.includes('alter schema') ||
    sqlLower.includes('drop schema')
  ) {
    keys.push(databaseKeys.schemas(ref))
  }
  if (
    sqlLower.includes('create function') ||
    sqlLower.includes('alter function') ||
    sqlLower.includes('drop function')
  ) {
    keys.push(databaseKeys.databaseFunctions(ref))
  }
  if (
    sqlLower.includes('create trigger') ||
    sqlLower.includes('alter trigger') ||
    sqlLower.includes('drop trigger')
  ) {
    keys.push(databaseTriggerKeys.list(ref))
  }
  if (
    sqlLower.includes('create policy') ||
    sqlLower.includes('alter policy') ||
    sqlLower.includes('drop policy')
  ) {
    keys.push(databasePoliciesKeys.list(ref))
  }
  if (
    sqlLower.includes('create type') ||
    sqlLower.includes('alter type') ||
    sqlLower.includes('drop type')
  ) {
    keys.push(enumeratedTypesKeys.list(ref))
  }
  if (
    sqlLower.includes('create role') ||
    sqlLower.includes('alter role') ||
    sqlLower.includes('drop role')
  ) {
    keys.push(databaseRoleKeys.databaseRoles(ref))
  }
  if (sqlLower.includes('create index') || sqlLower.includes('drop index')) {
    keys.push(databaseKeys.indexes(ref))
  }
  if (sqlLower.includes('create extension') || sqlLower.includes('drop extension')) {
    keys.push(databaseExtensionsKeys.list(ref))
  }

  return keys
}
