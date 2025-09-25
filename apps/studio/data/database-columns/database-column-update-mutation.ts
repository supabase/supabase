import pgMeta from '@supabase/pg-meta'
import { PGColumn } from '@supabase/pg-meta/src/pg-meta-columns'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'

export type UpdateColumnBody = Omit<
  components['schemas']['UpdateColumnBody'],
  'check' | 'comment'
> & {
  check?: string | null
  comment?: string | null
}

export type DatabaseColumnUpdateVariables = {
  projectRef: string
  connectionString?: string | null
  originalColumn: Pick<
    PGColumn,
    | 'id'
    | 'name'
    | 'schema'
    | 'table'
    | 'table_id'
    | 'ordinal_position'
    | 'is_identity'
    | 'is_unique'
  >
  payload: UpdateColumnBody
}

export async function updateDatabaseColumn({
  projectRef,
  connectionString,
  originalColumn,
  payload,
}: DatabaseColumnUpdateVariables) {
  const { sql } = pgMeta.columns.update(originalColumn, {
    name: payload.name,
    type: payload.type,
    drop_default: payload.dropDefault,
    default_value: payload.defaultValue,
    default_value_format: payload.defaultValueFormat,
    is_identity: payload.isIdentity,
    identity_generation: payload.identityGeneration,
    is_nullable: payload.isNullable,
    is_unique: payload.isUnique,
    comment: payload.comment,
    check: payload.check,
  })

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['column', 'update', originalColumn.id],
  })

  return result
}

type DatabaseColumnUpdateData = Awaited<ReturnType<typeof updateDatabaseColumn>>

export const useDatabaseColumnUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseColumnUpdateData, ResponseError, DatabaseColumnUpdateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<DatabaseColumnUpdateData, ResponseError, DatabaseColumnUpdateVariables>(
    (vars) => updateDatabaseColumn(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database column: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
