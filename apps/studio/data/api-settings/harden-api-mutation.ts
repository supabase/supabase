import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { get, handleError, patch } from 'data/fetchers'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { configKeys } from 'data/config/keys'

export type HardenAPIVariables = {
  schema: string
  projectRef: string
  connectionString?: string
}

export async function hardenAPI({ schema, projectRef, connectionString }: HardenAPIVariables) {
  const sql = `
create schema if not exists ${schema};
grant usage on schema ${schema} to anon, authenticated;
  `.trim()

  await executeSql({ projectRef, connectionString, sql })

  const { data, error: configError } = await get('/platform/projects/{ref}/config/postgrest', {
    params: { path: { ref: projectRef } },
  })

  if (configError) return handleError(configError)

  // @ts-ignore [Joshen] API typing issue
  const { db_extra_search_path, db_pool, db_schema, max_rows } = data
  const updatedDbSchema = [schema]
    .concat(db_schema.split(', ').filter((x) => x !== 'public'))
    .join(', ')

  const { error } = await patch('/platform/projects/{ref}/config/postgrest', {
    params: { path: { ref: projectRef } },
    body: {
      db_pool,
      max_rows,
      db_extra_search_path,
      db_schema: updatedDbSchema,
    },
  })

  if (error) handleError(error)
  return true
}

type HardenAPIData = Awaited<ReturnType<typeof hardenAPI>>

export const useHardenAPIMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<HardenAPIData, ResponseError, HardenAPIVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<HardenAPIData, ResponseError, HardenAPIVariables>((vars) => hardenAPI(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(configKeys.postgrest(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to enact changes to harden Data API: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
