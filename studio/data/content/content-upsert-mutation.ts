import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'

import { components } from 'data/api'
import { put } from 'data/fetchers'
import { contentKeys } from './keys'
import { Content } from './content-query'

export type UpsertContentPayload = Omit<components['schemas']['UpsertContentParams'], 'content'> & {
  content: Content['content']
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
  if (error) throw error

  return data
}

export type UpsertContentData = Awaited<ReturnType<typeof upsertContent>>

export const useContentUpsertMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<UpsertContentData, unknown, UpsertContentVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpsertContentData, unknown, UpsertContentVariables>(
    (args) => upsertContent(args),
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
