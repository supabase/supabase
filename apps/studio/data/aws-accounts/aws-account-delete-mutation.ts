import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { awsAccountKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type AWSAccountDeleteVariables = {
  projectRef: string
  awsAccountId: string
  databaseIdentifier?: string
}

export async function deleteAWSAccount({
  projectRef,
  awsAccountId,
  databaseIdentifier,
}: AWSAccountDeleteVariables) {
  const deleteRequest = del as unknown as (
    path: string,
    init: {
      params: {
        path: Record<string, string>
      }
    }
  ) => Promise<{ data: unknown; error: unknown }>

  const path = databaseIdentifier
    ? '/platform/projects/{ref}/privatelink/associations/aws-account/{aws_account_id}/database/{database_identifier}'
    : '/platform/projects/{ref}/privatelink/associations/aws-account/{aws_account_id}'

  const { data, error } = await deleteRequest(path, {
    params: {
      path: {
        ref: projectRef,
        aws_account_id: awsAccountId,
        ...(databaseIdentifier ? { database_identifier: databaseIdentifier } : {}),
      },
    },
  })

  if (error) handleError(error)
  return data
}

type AWSAccountDeleteData = Awaited<ReturnType<typeof deleteAWSAccount>>

export const useAWSAccountDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AWSAccountDeleteData, ResponseError, AWSAccountDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<AWSAccountDeleteData, ResponseError, AWSAccountDeleteVariables>({
    mutationFn: (vars) => deleteAWSAccount(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: awsAccountKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete association: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
