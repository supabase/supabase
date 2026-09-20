import pgMeta, { type PGPolicy } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSql } from '../sql/execute-sql-mutation'
import { databasePoliciesKeys } from './keys'
import type { Policy } from '@/components/interfaces/Database/Policies/PolicyTableRow/PolicyTableRow.utils'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type DatabasePoliciesVariables = {
  projectRef?: string
  connectionString?: string | null
  schemas?: string[]
}

export async function getDatabasePolicies(
  { projectRef, connectionString, schemas }: DatabasePoliciesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql } = pgMeta.policies.list({ includedSchemas: schemas })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['policies', schemas],
    },
    signal
  )

  return result as PGPolicy[]
}

export type DatabasePoliciesData = Awaited<ReturnType<typeof getDatabasePolicies>>
export type DatabasePoliciesError = ResponseError

function markSavedPolicySafe(policy: DatabasePoliciesData[number]): Policy {
  return policy as Policy
}

export const useDatabasePoliciesQuery = <TData = Policy[]>(
  { projectRef, connectionString, schemas }: DatabasePoliciesVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<Policy[], DatabasePoliciesError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<Policy[], DatabasePoliciesError, TData>({
    queryKey: databasePoliciesKeys.list(projectRef, schemas),
    queryFn: ({ signal }) =>
      getDatabasePolicies({ projectRef, connectionString, schemas }, signal).then((data) =>
        data.map(markSavedPolicySafe)
      ),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
