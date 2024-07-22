import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { contentKeys } from './keys'

export type DeleteSQLSnippetFoldersVariables = {
  projectRef: string
  ids: string[]
}

export async function deleteSQLSnippetFolders(
  { projectRef, ids }: DeleteSQLSnippetFoldersVariables,
  signal?: AbortSignal
) {
  const { data, error } = await del('/platform/projects/{ref}/content/folders', {
    // @ts-ignore [Joshen] API codegen issue
    params: { path: { ref: projectRef }, query: { ids } },
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type DeleteSQLSnippetFoldersData = Awaited<ReturnType<typeof deleteSQLSnippetFolders>>

export const useSQLSnippetFoldersDeleteMutation = ({
  onError,
  onSuccess,
  invalidateQueriesOnSuccess = true,
  ...options
}: Omit<
  UseMutationOptions<DeleteSQLSnippetFoldersData, ResponseError, DeleteSQLSnippetFoldersVariables>,
  'mutationFn'
> & {
  invalidateQueriesOnSuccess?: boolean
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteSQLSnippetFoldersData, ResponseError, DeleteSQLSnippetFoldersVariables>(
    (args) => deleteSQLSnippetFolders(args),
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
