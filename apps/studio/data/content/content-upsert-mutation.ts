import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { Content } from './content-query'
import { contentKeys } from './keys'

export type UpsertContentPayload = Omit<components['schemas']['UpsertContentBody'], 'content'> & {
  content: Partial<Content['content']>
}

export type UpsertContentVariables = {
  projectRef: string
  payload: UpsertContentPayload
}

export async function upsertContent(
  { projectRef, payload }: UpsertContentVariables,
  signal?: AbortSignal
) {
  const { data, error } = await put('/platform/projects/{ref}/content', {
    params: { path: { ref: projectRef } },
    body: {
      id: payload.id,
      name: payload.name,
      description: payload.description,
      project_id: payload.project_id,
      owner_id: payload.owner_id,
      type: payload.type,
      visibility: payload.visibility,
      content: payload.content as any,
    },
    signal,
  })
  if (error) handleError(error)

  return data
}

export type UpsertContentData = Awaited<ReturnType<typeof upsertContent>>

export const useContentUpsertMutation = ({
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
