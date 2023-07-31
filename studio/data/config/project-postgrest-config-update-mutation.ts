import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectPostgrestConfigUpdateVariables = {
  projectRef: string
  dbSchema: string
  maxRows: string
  dbExtraSearchPath: string
}

export async function updateProjectPostgrestConfig({
  projectRef,
  dbSchema,
  maxRows,
  dbExtraSearchPath,
}: ProjectPostgrestConfigUpdateVariables) {
  const response = await patch(`${API_URL}/projects/${projectRef}/config/postgrest`, {
    db_schema: dbSchema,
    max_rows: maxRows,
    db_extra_search_path: dbExtraSearchPath,
  })

  if (response.error) throw response.error
  return response
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
