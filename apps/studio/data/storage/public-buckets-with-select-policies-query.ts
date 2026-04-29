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
 * For the given public bucket, checks whether any permissive SELECT or ALL policy
 * on storage.objects broadly allows listing for API roles. This combination means
 * clients can enumerate all objects in the bucket, which is usually unintentional.
 * Public buckets don't require SELECT policies for object access by URL. Policies
 * with additional object, path, or user constraints are excluded from this warning.
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
        AND p.cmd IN ('SELECT', 'ALL')
        AND p.permissive = 'PERMISSIVE'
        AND p.roles && ARRAY['public'::name, 'anon'::name, 'authenticated'::name]
      WHERE b.public = true
        AND b.id = ${literal(bucketId)}
        AND (
          p.qual IS NULL
          OR replace(replace(replace(lower(p.qual), ' ', ''), E'\\n', ''), E'\\t', '')
            IN ('true', '(true)', '1=1', '(1=1)')
          OR EXISTS (
            SELECT 1
            FROM regexp_match(
              p.qual,
              $re$\\A\\s*\\(*\\s*bucket_id\\s*=\\s*('(?:[^']|'')*')(\\s*::\\s*[[:alnum:]_\\.]+)?\\s*\\)*\\s*\\Z$re$,
              'i'
            ) AS bucket_match(matches)
            WHERE bucket_match.matches[1] = '''' || replace(b.id, '''', '''''') || ''''
          )
        )
      ORDER BY p.policyname
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
