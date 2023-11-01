import { toast } from 'react-hot-toast'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlData, ExecuteSqlVariables } from './execute-sql-query'
import { ResponseError } from 'types'

/* Execute Query */

export const useExecuteSqlMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ExecuteSqlData, ResponseError, ExecuteSqlVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ExecuteSqlData, ResponseError, ExecuteSqlVariables>(
    (args) => executeSql(args),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to execute SQL: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
