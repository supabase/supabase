import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { Content } from './content-query'
import { contentKeys } from './keys'

export type InsertContentPayload = Omit<components['schemas']['CreateContentBody'], 'content'> & {
  content: Content['content']
}

export type InsertContentVariables = {
  projectRef: string
  payload: InsertContentPayload
}

export type InsertContentResponse = components['schemas']['UserContentObject']

export async function insertContent(
  { projectRef, payload }: InsertContentVariables,
  signal?: AbortSignal
) {
  const { data, error } = await post('/platform/projects/{ref}/content', {
    params: { path: { ref: projectRef } },
    body: {
      id: payload.id,
      name: payload.name,
      description: payload.description,
      owner_id: payload.owner_id,
      type: payload.type,
      visibility: payload.visibility,
      content: payload.content as any,
      folder_id: payload.folder_id,
    },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type InsertContentData = Awaited<ReturnType<typeof insertContent>>

export const useContentInsertMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<InsertContentData, ResponseError, InsertContentVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<InsertContentData, ResponseError, InsertContentVariables>(
    (args) => insertContent(args),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(contentKeys.allContentLists(projectRef))
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
