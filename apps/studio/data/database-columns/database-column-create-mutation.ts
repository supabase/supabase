import pgMeta from '@supabase/pg-meta'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export type CreateColumnBody = {
  schema: string
  table: string
  name: string
  type: string
  check?: string
  comment?: string
  defaultValue?: any
  defaultValueFormat?: 'expression' | 'literal'
  identityGeneration?: 'BY DEFAULT' | 'ALWAYS'
  isIdentity?: boolean
  isNullable?: boolean
  isPrimaryKey?: boolean
  isUnique?: boolean
}

export type DatabaseColumnCreateVariables = {
  projectRef: string
  connectionString?: string | null
  payload: CreateColumnBody
}

export async function createDatabaseColumn({
  projectRef,
  connectionString,
  payload,
}: DatabaseColumnCreateVariables) {
  const { sql } = pgMeta.columns.create({
    schema: payload.schema,
    table: payload.table,
    name: payload.name,
    type: payload.type,
    default_value: payload.defaultValue,
    default_value_format: payload.defaultValueFormat,
    is_identity: payload.isIdentity,
    identity_generation: payload.identityGeneration,
    is_nullable: payload.isNullable,
    is_primary_key: payload.isPrimaryKey,
    is_unique: payload.isUnique,
    comment: payload.comment,
    check: payload.check,
  })

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['column', 'create'],
  })

  return result
}

type DatabaseColumnCreateData = Awaited<ReturnType<typeof createDatabaseColumn>>

export const useDatabaseColumnCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<DatabaseColumnCreateData, ResponseError, DatabaseColumnCreateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<DatabaseColumnCreateData, ResponseError, DatabaseColumnCreateVariables>({
    mutationFn: (vars) => createDatabaseColumn(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create database column: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
