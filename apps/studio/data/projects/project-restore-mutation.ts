import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { components } from 'api-types'

export type ReleaseChannel = components['schemas']['ReleaseChannel']
export type PostgresEngine = components['schemas']['PostgresEngine']

export type ProjectRestoreVariables = {
  ref: string
  postgresEngine?: PostgresEngine
  releaseChannel?: ReleaseChannel
}

export async function restoreProject({
  ref,
  postgresEngine,
  releaseChannel,
}: ProjectRestoreVariables) {
  const { data, error } = await post('/platform/projects/{ref}/restore', {
    params: { path: { ref } },
    body: {
      postgres_engine: postgresEngine,
      release_channel: releaseChannel,
    },
  })
  if (error) handleError(error)
  return data
}

type ProjectRestoreData = Awaited<ReturnType<typeof restoreProject>>

export const useProjectRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectRestoreData, ResponseError, ProjectRestoreVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ProjectRestoreData, ResponseError, ProjectRestoreVariables>(
    (vars) => restoreProject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to restore project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
