import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { contentKeys } from './keys'
import { handleError, patch } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type UpdateSQLSnippetFolderVariables = {
  projectRef: string
  id: string
  name: string
}

export async function updateSQLSnippetFolder(
  { projectRef, id, name }: UpdateSQLSnippetFolderVariables,
  signal?: AbortSignal
) {
  const { data, error } = await patch('/platform/projects/{ref}/content/folders/{id}', {
    params: { path: { ref: projectRef, id } },
    body: { name },
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type UpdateSQLSnippetFolderData = Awaited<ReturnType<typeof updateSQLSnippetFolder>>

export const useSQLSnippetFolderCreateMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    UpdateSQLSnippetFolderData,
    ResponseError,
    UpdateSQLSnippetFolderVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateSQLSnippetFolderData, ResponseError, UpdateSQLSnippetFolderVariables>({
    mutationFn: (args) => updateSQLSnippetFolder(args),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: contentKeys.folders(projectRef) })
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
  })
}
