import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import { awsAccountKeys } from './keys'

export type AWSAccountUpdateVariables = {
  projectRef: string
  id: string
  awsAccountId?: string
  description?: string
}

export async function updateAWSAccount({
  id,
  awsAccountId,
  description,
}: AWSAccountUpdateVariables) {
  // Mocked response
  const data = {
    id,
    awsAccountId: awsAccountId || '',
    description: description || '',
    status: 'connected' as const,
  }
  return data
}

type AWSAccountUpdateData = Awaited<ReturnType<typeof updateAWSAccount>>

export const useAWSAccountUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AWSAccountUpdateData, ResponseError, AWSAccountUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<AWSAccountUpdateData, ResponseError, AWSAccountUpdateVariables>(
    (vars) => updateAWSAccount(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(awsAccountKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update AWS account: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
