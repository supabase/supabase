import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { DBDEV_INSTALLATION_SQL } from './database-testing.constants'
import { databaseTestingKeys } from './keys'

export type DbDevInstallationVariables = {
  projectRef?: string
  connectionString?: string
}

export async function installDbDev({ projectRef, connectionString }: DbDevInstallationVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!connectionString) throw new Error('Connection string is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: DBDEV_INSTALLATION_SQL,
    queryKey: ['install-dbdev'],
  })
  return result
}

type DbDevInstallationData = Awaited<ReturnType<typeof installDbDev>>

export const useDbDevInstallationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DbDevInstallationData, ResponseError, DbDevInstallationVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DbDevInstallationData, ResponseError, DbDevInstallationVariables>(
    (vars) => installDbDev(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseTestingKeys.isDbDevInstalled(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to install dbdev: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
