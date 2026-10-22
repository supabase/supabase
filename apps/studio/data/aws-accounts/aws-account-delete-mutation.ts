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
  const { data, error } = databaseIdentifier
    ? await del(
        '/v2/projects/{ref}/private-link/associations/aws-account/{aws_account_id}/database/{database_identifier}',
        {
          params: {
            path: {
              ref: projectRef,
              aws_account_id: awsAccountId,
              database_identifier: databaseIdentifier,
            },
          },
        }
      )
    : await del('/v2/projects/{ref}/private-link/associations/aws-account/{aws_account_id}', {
        params: { path: { ref: projectRef, aws_account_id: awsAccountId } },
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
    async onSuccess(data, variables, context, mutationContext) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: awsAccountKeys.list(projectRef) })
      await onSuccess?.(data, variables, context, mutationContext)
    },
    async onError(data, variables, context, mutationContext) {
      if (onError === undefined) {
        toast.error(`Failed to delete connection: ${data.message}`)
      } else {
        onError(data, variables, context, mutationContext)
      }
    },
    ...options,
  })
}
