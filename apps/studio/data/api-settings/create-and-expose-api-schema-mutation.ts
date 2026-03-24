import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { configKeys } from 'data/config/keys'
import { databaseKeys } from 'data/database/keys'
import { handleError, patch } from 'data/fetchers'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export type CreateAndExposeAPISchemaVariables = {
  projectRef: string
  connectionString?: string | null
  existingPostgrestConfig: {
    db_pool?: number | null
    max_rows: number
    db_extra_search_path: string
    db_schema: string
  }
}

type UpdatePostgrestConfigBody = components['schemas']['UpdatePostgrestConfigBody']

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

  const body: UpdatePostgrestConfigBody = {
    max_rows,
    db_extra_search_path,
    db_schema: `api, ${db_schema}`,
  }
  if (db_pool) body.db_pool = db_pool

  const { error } = await patch('/platform/projects/{ref}/config/postgrest', {
    params: { path: { ref: projectRef } },
    body,
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
  UseCustomMutationOptions<
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
  >({
    mutationFn: (vars) => createAndExposeApiSchema(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: databaseKeys.schemas(projectRef) }),
        queryClient.invalidateQueries({ queryKey: configKeys.postgrest(projectRef) }),
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
