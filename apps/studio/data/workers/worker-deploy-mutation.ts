import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { workersKeys } from './keys'
import { parseWorker } from './workers.utils'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type WorkerDeployVariables = {
  projectRef: string
  name: string
  runtime: string
  size: string
  access: 'public' | 'private'
  instances: number
}

// The deploy endpoint accepts a spec without a build context as long as `runtime` is set,
// which is how the dashboard deploys without uploading a tarball the way the CLI does.
async function deployWorker({
  projectRef,
  name,
  runtime,
  size,
  access,
  instances,
}: WorkerDeployVariables) {
  const { data, error } = await post('/v2/projects/{ref}/workers/{name}/deploy', {
    params: { path: { ref: projectRef, name } },
    body: {
      data: {
        type: 'project_worker',
        attributes: {
          spec: { runtime, size, exposure: access, instances },
        },
      },
    },
  })

  if (error) return handleError(error)
  return parseWorker(data.data)
}

type WorkerDeployData = Awaited<ReturnType<typeof deployWorker>>

export const useWorkerDeployMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<WorkerDeployData, ResponseError, WorkerDeployVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deployWorker,
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workersKeys.list(variables.projectRef) }),
        queryClient.invalidateQueries({
          queryKey: workersKeys.detail(variables.projectRef, variables.name),
        }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to deploy worker: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
