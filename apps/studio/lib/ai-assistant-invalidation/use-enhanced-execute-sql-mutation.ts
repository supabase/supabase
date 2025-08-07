import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { executeSql, ExecuteSqlData, ExecuteSqlVariables } from 'data/sql/execute-sql-query'
import { QueryResponseError } from 'data/sql/execute-sql-mutation'
import { QueryCacheInvalidator } from './query-cache-invalidator'

export type EnhancedExecuteSqlVariables = ExecuteSqlVariables & {
  useSmartInvalidation?: boolean
}

/**
 * Enhanced version of useExecuteSqlMutation that uses the InvalidationRouter
 * for more granular cache invalidation
 */
export const useEnhancedExecuteSqlMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ExecuteSqlData, QueryResponseError, EnhancedExecuteSqlVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  // Create QueryCacheInvalidator instance
  const router = new QueryCacheInvalidator({
    queryClient,
  })

  return useMutation<ExecuteSqlData, QueryResponseError, EnhancedExecuteSqlVariables>(
    (args) => executeSql(args),
    {
      async onSuccess(data, variables, context) {
        const { sql, projectRef, useSmartInvalidation = true, contextualInvalidation } = variables

        // Use smart invalidation if enabled
        if (useSmartInvalidation && projectRef) {
          await router.processSql(sql, projectRef)
        }
        // Fall back to broad invalidation if requested
        else if (contextualInvalidation && projectRef) {
          const sqlLower = sql.toLowerCase()
          const isMutationSQL =
            sqlLower.includes('create ') ||
            sqlLower.includes('alter ') ||
            sqlLower.includes('drop ')

          if (isMutationSQL) {
            // Broad invalidation (existing behavior)
            const INVALIDATION_KEYS_IGNORE = [
              'branches',
              'settings-v2',
              'addons',
              'custom-domains',
              'content',
            ]
            const databaseRelatedKeys = queryClient
              .getQueryCache()
              .findAll(['projects', projectRef])
              .map((x) => x.queryKey)
              .filter((x) => !INVALIDATION_KEYS_IGNORE.some((a) => x.includes(a)))
            await Promise.all(databaseRelatedKeys.map((key) => queryClient.invalidateQueries(key)))
          }
        }

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
