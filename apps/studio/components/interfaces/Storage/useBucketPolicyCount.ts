import { formatPoliciesForStorage } from 'components/interfaces/Storage/Storage.utils'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

export const useBucketPolicyCount = () => {
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()
  const { data: buckets = [], isPending: isLoadingBuckets } = useBucketsQuery({
    projectRef: project?.ref,
  })
  const { data: policiesData = [], isPending: isLoadingPolicies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'storage',
  })
  const storageObjectsPolicies = policiesData.filter((policy: any) => policy.table === 'objects')
  const formattedPolicies = formatPoliciesForStorage(buckets, storageObjectsPolicies)

  const getPolicyCount = (bucketName: string) => {
    return formattedPolicies.find((x) => x.name === bucketName)?.policies.length ?? 0
  }

  return { getPolicyCount, isLoading: isLoadingProject || isLoadingBuckets || isLoadingPolicies }
}
