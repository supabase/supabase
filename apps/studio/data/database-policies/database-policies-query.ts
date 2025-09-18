import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError } from 'types'
import { DatabasePoliciesVariables, getDatabasePolicies } from './fetchers'
import { databasePoliciesKeys } from './keys'

export type DatabasePoliciesData = Awaited<ReturnType<typeof getDatabasePolicies>>
export type DatabasePoliciesError = ResponseError

export const useDatabasePoliciesQuery = <TData = DatabasePoliciesData>(
  { projectRef, connectionString, schema }: DatabasePoliciesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabasePoliciesData, DatabasePoliciesError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<DatabasePoliciesData, DatabasePoliciesError, TData>(
    databasePoliciesKeys.list(projectRef, schema),
    ({ signal }) => getDatabasePolicies({ projectRef, connectionString, schema }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && isActive,
      ...options,
    }
  )
}
