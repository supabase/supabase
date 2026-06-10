import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ContentData } from './content-query'
import { contentKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type DeleteContentVariables = { projectRef: string; ids: string[] }
type DeleteContext = { snapshots: [QueryKey, ContentData | undefined][] }

export async function deleteContents(
  { projectRef, ids }: DeleteContentVariables,
  signal?: AbortSignal
) {
  const { data, error } = await del('/platform/projects/{ref}/content', {
    headers: { Version: '2' },
    params: {
      path: { ref: projectRef },
      query: { ids: ids.join(',') },
    },
    signal,
  })

  if (error) handleError(error)
  return data.map((x) => x.id)
}

type DeleteContentData = Awaited<ReturnType<typeof deleteContents>>

export const useContentDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<DeleteContentData, ResponseError, DeleteContentVariables, DeleteContext>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteContentData, ResponseError, DeleteContentVariables, DeleteContext>({
    mutationFn: (args) => deleteContents(args),
    async onMutate({ projectRef, ids }) {
      await queryClient.cancelQueries({ queryKey: contentKeys.allContentLists(projectRef) })

      const snapshots = queryClient.getQueriesData<ContentData>({
        queryKey: contentKeys.allContentLists(projectRef),
      })

      for (const [queryKey, data] of snapshots) {
        if (data?.content) {
          queryClient.setQueryData<ContentData>(queryKey, {
            ...data,
            content: data.content.filter((item) => !ids.includes(item.id)),
          })
        }
      }

      return { snapshots }
    },
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: contentKeys.allContentLists(projectRef) }),
        queryClient.invalidateQueries({ queryKey: contentKeys.infiniteList(projectRef) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (context?.snapshots) {
        for (const [queryKey, data] of context.snapshots) {
          queryClient.setQueryData(queryKey, data)
        }
      }

      if (onError === undefined) {
        toast.error(`Failed to delete contents: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
