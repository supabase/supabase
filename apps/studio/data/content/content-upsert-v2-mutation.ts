import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { Content } from './content-query'
import { contentKeys } from './keys'

export type UpsertContentPayloadV2 = Omit<
  components['schemas']['UpsertContentBodyV2'],
  'content'
> & {
  content: Content['content']
}

export type UpsertContentVariables = {
  projectRef: string
  payload: UpsertContentPayloadV2
}

export async function upsertContent(
  { projectRef, payload }: UpsertContentVariables,
  signal?: AbortSignal
) {
  const { data, error } = await put('/platform/projects/{ref}/content', {
    // @ts-ignore API codegen is wrong, any is also cause of API codegen being unable to handle versioning
    params: { path: { ref: projectRef } },
    body: payload as any,
    headers: { Version: '2' },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type UpsertContentData = Awaited<ReturnType<typeof upsertContent>>

export const useContentUpsertV2Mutation = ({
  onError,
  onSuccess,
  invalidateQueriesOnSuccess = true,
  ...options
}: Omit<
  UseMutationOptions<UpsertContentData, ResponseError, UpsertContentVariables>,
  'mutationFn'
> & {
  invalidateQueriesOnSuccess?: boolean
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpsertContentData, ResponseError, UpsertContentVariables>(
    (args) => upsertContent(args),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        if (invalidateQueriesOnSuccess) {
          await queryClient.invalidateQueries(contentKeys.list(projectRef))
        }
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to insert content: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
