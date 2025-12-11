import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, put } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import type { Content } from './content-query'
import { contentKeys } from './keys'
import type { Snippet } from './sql-folders-query'

export type UpsertContentPayload = Omit<components['schemas']['UpsertContentBody'], 'content'> & {
  content: Partial<Content['content']>
  favorite?: boolean
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
    body: payload,
    headers: { Version: '2' },
    signal,
  })
  if (error) handleError(error)

  return data as Snippet | null
}

export type UpsertContentData = Awaited<ReturnType<typeof upsertContent>>

export const useContentUpsertMutation = ({
  onError,
  onSuccess,
  invalidateQueriesOnSuccess = true,
  ...options
}: Omit<
  UseCustomMutationOptions<UpsertContentData, ResponseError, UpsertContentVariables>,
  'mutationFn'
> & {
  invalidateQueriesOnSuccess?: boolean
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpsertContentData, ResponseError, UpsertContentVariables>({
    mutationFn: (args) => upsertContent(args),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      if (invalidateQueriesOnSuccess) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: contentKeys.allContentLists(projectRef) }),
          queryClient.invalidateQueries({ queryKey: contentKeys.infiniteList(projectRef) }),
        ])
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
  })
}
