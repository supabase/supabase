import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { contentKeys } from './keys'

export type DeleteSQLSnippetFolderVariables = {
  projectRef: string
  name: string
  parentId?: string
}

export async function deleteSQLSnippetFolder(
  { projectRef, name, parentId }: DeleteSQLSnippetFolderVariables,
  signal?: AbortSignal
) {
  const body: { name: string; parentId?: string } = { name }
  if (parentId) body.parentId = parentId

  const { data, error } = await del('/platform/projects/{ref}/content/folders', {
    // @ts-ignore [Joshen] API codegen issue
    params: { path: { ref: projectRef }, query: { ids: [] } },
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type DeleteSQLSnippetFolderData = Awaited<ReturnType<typeof deleteSQLSnippetFolder>>

export const useSQLSnippetFolderDeleteMutation = ({
  onError,
  onSuccess,
  invalidateQueriesOnSuccess = true,
  ...options
}: Omit<
  UseMutationOptions<DeleteSQLSnippetFolderData, ResponseError, DeleteSQLSnippetFolderVariables>,
  'mutationFn'
> & {
  invalidateQueriesOnSuccess?: boolean
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteSQLSnippetFolderData, ResponseError, DeleteSQLSnippetFolderVariables>(
    (args) => deleteSQLSnippetFolder(args),
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
          toast.error(`Failed to delete folder: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
