import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { put } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { UserContent } from 'types'
import { contentKeys } from './keys'

type UpsertContentVariables = {
  projectRef: string
  id: string
  payload: Partial<UserContent>
}

export async function upsertContent(
  { projectRef, payload }: UpsertContentVariables,
  signal?: AbortSignal
) {
  const response = await put<UserContent[]>(`${API_URL}/projects/${projectRef}/content`, payload, {
    signal,
  })

  if (response.error) throw response.error
  return { content: response }
}

type UpsertContentData = Awaited<ReturnType<typeof upsertContent>>

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
