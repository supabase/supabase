import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from '@/data/fetchers'
import { createProjectSupabaseClient } from '@/lib/project-supabase-client'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type SignBucketObjectParams = {
  projectRef: string
  clientEndpoint: string
  bucketId?: string
  path: string
  expiresIn: number
  /** Signs a specific version of the object. Defaults to the current one. */
  versionId?: string
}
export const signBucketObject = async ({
  projectRef,
  clientEndpoint,
  bucketId,
  path,
  expiresIn,
  versionId,
}: SignBucketObjectParams) => {
  if (!bucketId) throw new Error('bucketId is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)
  // Omitted rather than sent as `undefined`, so current-version requests are unchanged.
  const { data, error } = await supabaseClient.storage
    .from(bucketId)
    .createSignedUrl(path, expiresIn, versionId === undefined ? undefined : { versionId })

  if (error) handleError(error)
  return data!
}

type SignBucketObjectData = Awaited<ReturnType<typeof signBucketObject>>

type SignBucketObjectsParams = {
  projectRef: string
  clientEndpoint: string
  bucketId?: string
  paths: Array<string>
  expiresIn: number
}
export const signBucketObjects = async ({
  projectRef,
  clientEndpoint,
  bucketId,
  paths,
  expiresIn,
}: SignBucketObjectsParams) => {
  if (!bucketId) throw new Error('bucketId is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)
  const { data, error } = await supabaseClient.storage
    .from(bucketId)
    .createSignedUrls(paths, expiresIn)

  if (error) handleError(error)
  return data ?? []
}

export const useGetSignBucketObjectMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SignBucketObjectData, ResponseError, SignBucketObjectParams>,
  'mutationFn'
> = {}) => {
  return useMutation<SignBucketObjectData, ResponseError, SignBucketObjectParams>({
    mutationFn: (vars) => signBucketObject(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to get sign bucket object: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
