import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import { awsAccountKeys } from './keys'

export type AWSAccountDeleteVariables = {
  projectRef: string
  id: string
}

export async function deleteAWSAccount({ id }: AWSAccountDeleteVariables) {
  // Mocked response
  const data = {
    id,
  }
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
  return useMutation<AWSAccountDeleteData, ResponseError, AWSAccountDeleteVariables>(
    (vars) => deleteAWSAccount(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(awsAccountKeys.list(projectRef))
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
    }
  )
}
