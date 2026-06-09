import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Content } from './content-query'
import { unmapSqlContentField } from './content-remap'
import { contentKeys } from './keys'
import type { Snippet } from './sql-folders-query'
import type { components } from '@/data/api'
import { handleError, put } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type UpsertContentPayload = Omit<components['schemas']['UpsertContentBody'], 'content'> & {
  id: string
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
  try {
    const { data, error } = await put('/platform/projects/{ref}/content', {
      params: { path: { ref: projectRef } },
      body: unmapSqlContentField(payload),
      headers: { Version: '2' },
      signal,
    })
    if (error) handleError(error)

    return data as Snippet | null
  } catch (error) {
    // Some environments (e.g. staging) return a successful response with an empty
    // body but without a `Content-Length: 0` header. openapi-fetch then tries to parse the
    // empty body as JSON and throws a SyntaxError, even though the content was saved
    // successfully. Treat this case as a success with no returned data.
    if (error instanceof SyntaxError) return null
    throw error
  }
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
