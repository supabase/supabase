import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import { awsAccountKeys } from './keys'

export type AWSAccountCreateVariables = {
  projectRef: string
  awsAccountId: string
  description: string
}

export async function createAWSAccount({
  projectRef,
  awsAccountId,
  description,
}: AWSAccountCreateVariables) {
  // Mocked response
  const data = {
    id: Math.random().toString(),
    awsAccountId,
    description,
    status: 'pending' as const,
  }
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
  return useMutation<AWSAccountCreateData, ResponseError, AWSAccountCreateVariables>(
    (vars) => createAWSAccount(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(awsAccountKeys.list(projectRef))
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
    }
  )
}
