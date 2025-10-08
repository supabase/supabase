import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectPostgrestConfigUpdateVariables = {
  projectRef: string
  dbSchema: string
  maxRows: number
  dbExtraSearchPath: string
  dbPool: number | null
}

type UpdatePostgrestConfigResponse = components['schemas']['UpdatePostgrestConfigBody']

export async function updateProjectPostgrestConfig({
  projectRef,
  dbSchema,
  maxRows,
  dbExtraSearchPath,
  dbPool,
}: ProjectPostgrestConfigUpdateVariables) {
  const payload: UpdatePostgrestConfigResponse = {
    db_schema: dbSchema,
    max_rows: maxRows,
    db_extra_search_path: dbExtraSearchPath,
  }
  if (dbPool) payload.db_pool = dbPool

  const { data, error } = await patch('/platform/projects/{ref}/config/postgrest', {
    params: { path: { ref: projectRef } },
    body: payload,
  })

  if (error) handleError(error)
  return data
}

type ProjectPostgrestConfigUpdateData = Awaited<ReturnType<typeof updateProjectPostgrestConfig>>

export const useProjectPostgrestConfigUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    ProjectPostgrestConfigUpdateData,
    ResponseError,
    ProjectPostgrestConfigUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    ProjectPostgrestConfigUpdateData,
    ResponseError,
    ProjectPostgrestConfigUpdateVariables
  >((vars) => updateProjectPostgrestConfig(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      queryClient.invalidateQueries(configKeys.postgrest(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update Postgrest config: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
