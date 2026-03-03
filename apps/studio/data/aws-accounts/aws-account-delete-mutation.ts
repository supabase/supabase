import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { awsAccountKeys } from './keys'

export type AWSAccountDeleteVariables = {
  projectRef: string
  awsAccountId: string
}

export async function deleteAWSAccount({ projectRef, awsAccountId }: AWSAccountDeleteVariables) {
  const { data, error } = await del(
    '/platform/projects/{ref}/privatelink/associations/aws-account/{aws_account_id}',
    {
      params: {
        path: {
          ref: projectRef,
          aws_account_id: awsAccountId,
        },
      },
    }
  )

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
        toast.error(`Failed to delete AWS account: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
