import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { executeQuery, ExecuteQueryData, ExecuteQueryVariables } from './useExecuteQueryQuery'

/* Execute Query */

export const useExecuteQueryMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<ExecuteQueryData, unknown, ExecuteQueryVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ExecuteQueryData, unknown, ExecuteQueryVariables>(
    (args) => executeQuery(args),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
