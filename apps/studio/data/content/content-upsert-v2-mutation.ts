import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { Content } from './content-query'
import { contentKeys } from './keys'

export type UpsertContentPayloadV2 = Omit<
  components['schemas']['UpsertContentBodyDto'],
  'content' | 'folder_id'
> & {
  // [Joshen] Am not sure why but API codegen is typing folder_id as undefined | null
  // although API docs on http://localhost:8080/api#tag/projects-content/PUT/platform/projects/{ref}/content
  // shows that it's correctly typed as UUID | null, so manually fixing it here for now
  folder_id?: string | null
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
          await queryClient.invalidateQueries(contentKeys.allContentLists(projectRef))
        }
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to upsert content: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
