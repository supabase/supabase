import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createTarGz } from './createTarGz'
import { workersKeys } from './keys'
import { STARTER_RUNTIME, starterFiles } from './workers.templates'
import { parseWorker } from './workers.utils'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type WorkerDeployVariables = {
  projectRef: string
  name: string
  size: string
  access: 'public' | 'private'
  instances: number
}

async function deployWorker({ projectRef, name, size, access, instances }: WorkerDeployVariables) {
  const { data: slot, error: slotError } = await post('/v2/projects/{ref}/workers/{name}/uploads', {
    params: { path: { ref: projectRef, name } },
  })
  if (slotError) return handleError(slotError)

  // The presigned URL carries its own authorization, so this one call bypasses the API client
  // on purpose — sending our bearer token to storage would be rejected.
  const upload = await fetch(slot.data.attributes.url, {
    method: 'PUT',
    body: await createTarGz(starterFiles()),
    headers: { 'content-type': 'application/gzip' },
  })
  if (!upload.ok) {
    throw new Error(`Failed to upload the build context (${upload.status})`)
  }

  const { data, error } = await post('/v2/projects/{ref}/workers/{name}/deploy', {
    params: { path: { ref: projectRef, name } },
    body: {
      data: {
        type: 'project_worker',
        attributes: {
          context_upload_id: slot.data.id,
          spec: { runtime: STARTER_RUNTIME, size, exposure: access, instances },
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
