import { getCreatePublicationSQL } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from '../sql/execute-sql-query'
import { replicationKeys } from './keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type CreatePublicationParams = {
  projectRef: string
  sourceId: number
  name: string
  tables: { schema: string; name: string }[]
  connectionString?: string | null
}

async function createPublication(
  { projectRef, connectionString, name, tables }: CreatePublicationParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const sql = getCreatePublicationSQL({ name, tables })
  const { result } = await executeSql({ projectRef, connectionString, sql }, signal)

  return result
}

type CreatePublicationData = Awaited<ReturnType<typeof createPublication>>

export const useCreatePublicationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<CreatePublicationData, ResponseError, CreatePublicationParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreatePublicationData, ResponseError, CreatePublicationParams>({
    mutationFn: (vars) => createPublication(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, sourceId } = variables
      await queryClient.invalidateQueries({
        queryKey: replicationKeys.publications(projectRef, sourceId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create publication: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
