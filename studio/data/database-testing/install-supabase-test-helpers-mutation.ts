import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'

export type SupabaseTestHelpersInstallationVariables = {
  projectRef?: string
  connectionString?: string
}

export async function installSupabaseTestHelpers({
  projectRef,
  connectionString,
}: SupabaseTestHelpersInstallationVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!connectionString) throw new Error('Connection string is required')
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select dbdev.install('basejump-supabase_test_helpers');`,
    queryKey: ['install-test-helpers'],
  })
  return result
}

type SupabaseTestHelpersInstallationData = Awaited<ReturnType<typeof installSupabaseTestHelpers>>

export const useSupabaseTestHelpersInstallationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    SupabaseTestHelpersInstallationData,
    ResponseError,
    SupabaseTestHelpersInstallationVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    SupabaseTestHelpersInstallationData,
    ResponseError,
    SupabaseTestHelpersInstallationVariables
  >((vars) => installSupabaseTestHelpers(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to install supabase_test_helpers: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
