import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { configKeys } from 'data/config/keys'
import { handleError, patch } from 'data/fetchers'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import type { ResponseError } from 'types'

export type CreateAndExposeAPISchemaVariables = {
  projectRef: string
  connectionString?: string
  existingPostgrestConfig: {
    db_pool: any
    max_rows: number
    db_extra_search_path: string
    db_schema: string
  }
}

export async function createAndExposeApiSchema({
  projectRef,
  connectionString,
  existingPostgrestConfig,
}: CreateAndExposeAPISchemaVariables) {
  const sql = `
create schema if not exists api;
grant usage on schema api to anon, authenticated;
  `.trim()

  await executeSql({ projectRef, connectionString, sql })

  const { db_extra_search_path, db_pool, db_schema, max_rows } = existingPostgrestConfig
  const { error } = await patch('/platform/projects/{ref}/config/postgrest', {
    params: { path: { ref: projectRef } },
    body: {
      db_pool,
      max_rows,
      db_extra_search_path,
      db_schema: `api, ${db_schema}`,
    },
  })

  if (error) handleError(error)
  return true
}

type CreateAndExposeAPISchemaData = Awaited<ReturnType<typeof createAndExposeApiSchema>>

export const useCreateAndExposeAPISchemaMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    CreateAndExposeAPISchemaData,
    ResponseError,
    CreateAndExposeAPISchemaVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    CreateAndExposeAPISchemaData,
    ResponseError,
    CreateAndExposeAPISchemaVariables
  >((vars) => createAndExposeApiSchema(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries(sqlKeys.query(projectRef, ['schemas', 'list'])),
        queryClient.invalidateQueries(configKeys.postgrest(projectRef)),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create and expose API schema: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
