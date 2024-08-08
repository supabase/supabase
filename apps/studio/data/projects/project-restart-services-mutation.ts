import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ProjectRestartServicesVariables = {
  ref: string
  region: string
  services: (
    | 'postgresql'
    | 'adminapi'
    | 'api-gateway'
    | 'functions'
    | 'gotrue'
    | 'kong'
    | 'pgbouncer'
    | 'pgsodium'
    | 'postgrest'
    | 'realtime'
    | 'storage'
    | 'walg'
    | 'autoshutdown'
  )[]
  source_notification_id?: string
}

export async function restartProjectServices({
  ref,
  region,
  services = ['postgresql'],
  source_notification_id,
}: ProjectRestartServicesVariables) {
  const { data, error } = await post('/platform/projects/{ref}/restart-services', {
    params: { path: { ref } },
    body: {
      restartRequest: {
        region,
        services,
        source_notification_id,
      },
    },
  })
  if (error) handleError(error)
  return data
}

type ProjectRestartServicesData = Awaited<ReturnType<typeof restartProjectServices>>

export const useProjectRestartServicesMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectRestartServicesData, ResponseError, ProjectRestartServicesVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ProjectRestartServicesData, ResponseError, ProjectRestartServicesVariables>(
    (vars) => restartProjectServices(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to restart project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
