import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { components } from 'data/api'
import { put } from 'data/fetchers'
import { ResponseError } from 'types'
import { Content } from './content-query'
import { contentKeys } from './keys'

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
    // @ts-ignore API codegen is wrong
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
  onError,
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<UpsertContentData, ResponseError, UpsertContentVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpsertContentData, ResponseError, UpsertContentVariables>(
    (args) => upsertContent(args),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(contentKeys.list(projectRef))
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
