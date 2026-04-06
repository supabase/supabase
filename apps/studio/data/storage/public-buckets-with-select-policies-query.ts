import { literal } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { storageKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type PublicBucketsWithSelectPoliciesVariables = {
  projectRef?: string
  connectionString?: string | null
  bucketId: string
}

export type PublicBucketSelectPolicy = {
  bucket_id: string
  bucket_name: string
  policyname: string
}

/**
 * For the given public bucket, checks whether any SELECT policy on storage.objects
 * references this bucket's ID in its qual expression. This combination means anyone
 * can enumerate all objects in the bucket, which is usually unintentional — public
 * buckets don't require SELECT policies for object access by URL.
 *
 * Scoped to a single bucket so the query is a point-lookup rather than a full scan.
 */
async function getPublicBucketsWithSelectPolicies({
  projectRef,
  connectionString,
  bucketId,
}: PublicBucketsWithSelectPoliciesVariables) {
  const { result } = await executeSql<PublicBucketSelectPolicy[]>({
    projectRef,
    connectionString,
    sql: `
      SELECT b.id AS bucket_id, b.name AS bucket_name, p.policyname
      FROM storage.buckets b
      JOIN pg_policies p
        ON p.schemaname = 'storage'
        AND p.tablename = 'objects'
        AND p.cmd = 'SELECT'
      WHERE b.public = true
        AND b.id = ${literal(bucketId)}
        AND p.qual ~* ('bucket_id\\s*=\\s*' || quote_literal(b.id))
    `,
  })

  return result
}

export type PublicBucketsWithSelectPoliciesData = Awaited<
  ReturnType<typeof getPublicBucketsWithSelectPolicies>
>
export type PublicBucketsWithSelectPoliciesError = ResponseError

export const usePublicBucketsWithSelectPoliciesQuery = <
  TData = PublicBucketsWithSelectPoliciesData,
>(
  { projectRef, connectionString, bucketId }: PublicBucketsWithSelectPoliciesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    PublicBucketsWithSelectPoliciesData,
    PublicBucketsWithSelectPoliciesError,
    TData
  > = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<PublicBucketsWithSelectPoliciesData, PublicBucketsWithSelectPoliciesError, TData>(
    {
      queryKey: storageKeys.publicBucketsWithSelectPolicies(projectRef, bucketId),
      queryFn: () => getPublicBucketsWithSelectPolicies({ projectRef, connectionString, bucketId }),
      enabled: enabled && typeof projectRef !== 'undefined' && isActive,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      ...options,
    }
  )
}
