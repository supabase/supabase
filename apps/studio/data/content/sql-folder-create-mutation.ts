import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { contentKeys } from './keys'

export type CreateSQLSnippetFolderVariables = {
  projectRef: string
  name: string
  parentId?: string
}

export async function createSQLSnippetFolder(
  { projectRef, name, parentId }: CreateSQLSnippetFolderVariables,
  signal?: AbortSignal
) {
  const body: { name: string; parentId?: string } = { name }
  if (parentId) body.parentId = parentId

  const { data, error } = await post('/platform/projects/{ref}/content/folders', {
    params: { path: { ref: projectRef } },
    body,
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type CreateSQLSnippetFolderData = Awaited<ReturnType<typeof createSQLSnippetFolder>>

export const useSQLSnippetFolderCreateMutation = ({
  onError,
  onSuccess,
  invalidateQueriesOnSuccess = true,
  ...options
}: Omit<
  UseMutationOptions<CreateSQLSnippetFolderData, ResponseError, CreateSQLSnippetFolderVariables>,
  'mutationFn'
> & {
  invalidateQueriesOnSuccess?: boolean
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateSQLSnippetFolderData, ResponseError, CreateSQLSnippetFolderVariables>(
    (args) => createSQLSnippetFolder(args),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        if (invalidateQueriesOnSuccess) {
          await queryClient.invalidateQueries(contentKeys.folders(projectRef))
        }
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create folder: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
