import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { contentKeys } from './keys'

export type UpdateSQLSnippetFolderVariables = {
  projectRef: string
  id: string
  name: string
  parentId?: string
}

export async function updateSQLSnippetFolder(
  { projectRef, id, name, parentId }: UpdateSQLSnippetFolderVariables,
  signal?: AbortSignal
) {
  const body: { name: string; parentId?: string } = { name }
  if (parentId) body.parentId = parentId

  const { data, error } = await patch('/platform/projects/{ref}/content/folders/{id}', {
    params: { path: { ref: projectRef, id } },
    body,
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type UpdateSQLSnippetFolderData = Awaited<ReturnType<typeof updateSQLSnippetFolder>>

export const useSQLSnippetFolderCreateMutation = ({
  onError,
  onSuccess,
  invalidateQueriesOnSuccess = true,
  ...options
}: Omit<
  UseMutationOptions<UpdateSQLSnippetFolderData, ResponseError, UpdateSQLSnippetFolderVariables>,
  'mutationFn'
> & {
  invalidateQueriesOnSuccess?: boolean
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateSQLSnippetFolderData, ResponseError, UpdateSQLSnippetFolderVariables>(
    (args) => updateSQLSnippetFolder(args),
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
          toast.error(`Failed to update folder: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
