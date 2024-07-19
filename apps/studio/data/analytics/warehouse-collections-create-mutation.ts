import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { handleError, post } from 'data/fetchers'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import { analyticsKeys } from './keys'

export type CreateCollectionArgs = {
  projectRef: string
  name: string
}

export async function createCollection({ projectRef, name }: CreateCollectionArgs) {
  const { data, error } = await post('/platform/projects/{ref}/analytics/warehouse/collections', {
    params: { path: { ref: projectRef } },
    body: { name },
  } as any)

  if (error) handleError(error)
  return data
}

type CreateCollectionData = Awaited<ReturnType<typeof createCollection>>

export const useCreateCollection = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CreateCollectionData, ResponseError, CreateCollectionArgs>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateCollectionData, ResponseError, CreateCollectionArgs>(
    (vars) => {
      // temporal fix
      // prevent users from creating collections with the same name
      // this will be handled by the backend
      // - jordi

      const existingCollectionNames = queryClient
        .getQueryData<CreateCollectionData[]>(analyticsKeys.warehouseCollections(vars.projectRef))
        ?.map((c) => c.name)

      if (existingCollectionNames?.includes(vars.name)) {
        throw new Error(`Collection with the name ${vars.name} already exists`)
      }

      return createCollection(vars)
    },
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(analyticsKeys.warehouseCollections(projectRef))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create collection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
