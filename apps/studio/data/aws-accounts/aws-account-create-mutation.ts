import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { awsAccountKeys } from './keys'

export type AWSAccountCreateVariables = {
  projectRef: string
  awsAccountId: string
  accountName?: string
}

export async function createAWSAccount({
  projectRef,
  awsAccountId,
  accountName,
}: AWSAccountCreateVariables) {
  const { data, error } = await post(
    '/platform/projects/{ref}/privatelink/associations/aws-account',
    {
      params: {
        path: { ref: projectRef },
      },
      body: {
        aws_account_id: awsAccountId,
        account_name: accountName,
      },
    }
  )

  if (error) handleError(error)
  return data
}

type AWSAccountCreateData = Awaited<ReturnType<typeof createAWSAccount>>

export const useAWSAccountCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AWSAccountCreateData, ResponseError, AWSAccountCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<AWSAccountCreateData, ResponseError, AWSAccountCreateVariables>({
    mutationFn: (vars) => createAWSAccount(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: awsAccountKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create AWS account: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
