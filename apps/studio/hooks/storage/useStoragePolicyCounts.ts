import { useMemo } from 'react'

import { formatPoliciesForStorage } from 'components/interfaces/Storage/Storage.utils'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { Bucket } from 'data/storage/buckets-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

export const useStoragePolicyCounts = (buckets: Bucket[]) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: policiesData = [], isLoading } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'storage',
  })

  const policyCountMap = useMemo(() => {
    const storageObjectsPolicies = policiesData.filter((policy: any) => policy.table === 'objects')
    const formattedPolicies = formatPoliciesForStorage(buckets, storageObjectsPolicies)

    return formattedPolicies.reduce((acc: Record<string, number>, bucketGroup: any) => {
      acc[bucketGroup.name] = bucketGroup.policies.length
      return acc
    }, {})
  }, [buckets, policiesData])

  const getPolicyCount = (bucketName: string) => {
    return policyCountMap[bucketName] || 0
  }

  return {
    getPolicyCount,
    isLoading,
    policyCountMap,
  }
}
