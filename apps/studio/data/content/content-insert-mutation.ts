import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'

import { components } from 'data/api'
import { post } from 'data/fetchers'
import { Content } from './content-query'
import { contentKeys } from './keys'

export type InsertContentPayload = Omit<components['schemas']['CreateContentParams'], 'content'> & {
  content: Content['content']
}

export type InsertContentVariables = {
  projectRef: string
  payload: InsertContentPayload
}

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
    },
    signal,
  })
  if (error) throw error

  return data
}

export type InsertContentData = Awaited<ReturnType<typeof insertContent>>

export const useContentInsertMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<InsertContentData, unknown, InsertContentVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<InsertContentData, unknown, InsertContentVariables>(
    (args) => insertContent(args),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await Promise.all([queryClient.invalidateQueries(contentKeys.list(projectRef))])

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
