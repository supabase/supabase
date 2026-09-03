import { useCallback, useMemo } from 'react'

import { getPolicyBucketNames } from '@/components/interfaces/Storage/Storage.utils'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export function useBucketPolicyCount() {
  const { data: project, isPending: isProjectPending } = useSelectedProjectQuery()
  const { data: policiesData = [], isPending: isPoliciesPending } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schemas: ['storage'],
  })

  const policyCountByBucket = useMemo(() => {
    const countMap = new Map<string, number>()
    for (const policy of policiesData) {
      if (policy.table !== 'objects') continue
      const bucketNames = getPolicyBucketNames(policy)
      for (const bucketName of bucketNames) {
        countMap.set(bucketName, (countMap.get(bucketName) ?? 0) + 1)
      }
    }
    return countMap
  }, [policiesData])

  const getPolicyCount = useCallback(
    (bucketName: string) => policyCountByBucket.get(bucketName) ?? 0,
    [policyCountByBucket]
  )

  return { getPolicyCount, isLoading: isProjectPending || isPoliciesPending }
}
