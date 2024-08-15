import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { configKeys } from 'data/config/keys'
import { databaseExtensionsKeys } from 'data/database-extensions/keys'
import { del, handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'

export type RemovePublicSchemaAndDisablePgGraphqlVariables = {
  projectRef: string
  connectionString?: string
  existingPostgrestConfig: {
    db_pool: any
    max_rows: number
    db_extra_search_path: string
    db_schema: string
  }
}

export async function removePublicFromExposedSchemasAndDisablePgGraphql({
  projectRef,
  connectionString,
  existingPostgrestConfig,
}: RemovePublicSchemaAndDisablePgGraphqlVariables) {
  const { db_extra_search_path, db_pool, db_schema, max_rows } = existingPostgrestConfig
  const updatedDbExtraSearchPath = db_extra_search_path
    .split(', ')
    .filter((x) => x !== 'public')
    .join(', ')
  const updatedDbSchema = db_schema
    .split(', ')
    .filter((x) => x !== 'public')
    .join(', ')

  const { error: configError } = await patch('/platform/projects/{ref}/config/postgrest', {
    params: { path: { ref: projectRef } },
    body: {
      db_pool,
      max_rows,
      db_extra_search_path: updatedDbExtraSearchPath,
      db_schema: updatedDbSchema,
    },
  })

  if (configError) handleError(configError)

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)
  const { error: extensionsError } = await del('/platform/pg-meta/{ref}/extensions', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { id: 'pg_graphql' },
    },
    headers,
  })

  if (extensionsError) handleError(extensionsError)

  return true
}

type RemovePublicSchemaAndDisablePgGraphqlData = Awaited<
  ReturnType<typeof removePublicFromExposedSchemasAndDisablePgGraphql>
>

export const useRemovePublicSchemaAndDisablePgGraphqlMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    RemovePublicSchemaAndDisablePgGraphqlData,
    ResponseError,
    RemovePublicSchemaAndDisablePgGraphqlVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    RemovePublicSchemaAndDisablePgGraphqlData,
    ResponseError,
    RemovePublicSchemaAndDisablePgGraphqlVariables
  >((vars) => removePublicFromExposedSchemasAndDisablePgGraphql(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries(configKeys.postgrest(projectRef)),
        queryClient.invalidateQueries(databaseExtensionsKeys.list(projectRef)),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(
          `Failed to remove public schema and disable pg_graphql extension: ${data.message}`
        )
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
