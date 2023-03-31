import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlData, ExecuteSqlVariables } from './execute-sql-query'

/* Execute Query */

export const useExecuteSqlMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<ExecuteSqlData, unknown, ExecuteSqlVariables>, 'mutationFn'> = {}) => {
  return useMutation<ExecuteSqlData, unknown, ExecuteSqlVariables>((args) => executeSql(args), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
