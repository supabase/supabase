'use client'

import { useMemo, useCallback } from 'react'
import { Storage } from 'icons'
import { useParams } from 'common'
import { useBucketsQuery, type Bucket } from 'data/storage/buckets-query'
import {
  useAnalyticsBucketsQuery,
  type AnalyticsBucket,
} from 'data/storage/analytics-buckets-query'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'
import {
  SkeletonResults,
  EmptyState,
  ResultsList,
  type SearchResult,
} from './ContextSearchResults.shared'

interface StorageSearchResultsProps {
  query: string
}

type ExtendedSearchResult = SearchResult & {
  bucketType?: 'file' | 'analytics' | 'vector'
  bucket?: unknown
}

export function StorageSearchResults({ query }: StorageSearchResultsProps) {
  const { ref: projectRef } = useParams()

  const trimmedQuery = query.trim()

  const {
    data: fileBuckets,
    isLoading: isLoadingFileBuckets,
    isError: isErrorFileBuckets,
  } = useBucketsQuery(
    {
      projectRef: projectRef ?? undefined,
    },
    {
      enabled: !!projectRef,
    }
  )

  const {
    data: analyticsBuckets,
    isLoading: isLoadingAnalyticsBuckets,
    isError: isErrorAnalyticsBuckets,
  } = useAnalyticsBucketsQuery(
    {
      projectRef: projectRef ?? undefined,
    },
    {
      enabled: !!projectRef,
    }
  )

  const {
    data: vectorBucketsData,
    isLoading: isLoadingVectorBuckets,
    isError: isErrorVectorBuckets,
  } = useVectorBucketsQuery(
    {
      projectRef: projectRef ?? undefined,
    },
    {
      enabled: !!projectRef,
    }
  )

  const vectorBuckets = vectorBucketsData?.vectorBuckets ?? []

  const isLoading = isLoadingFileBuckets || isLoadingAnalyticsBuckets || isLoadingVectorBuckets
  const isError = isErrorFileBuckets || isErrorAnalyticsBuckets || isErrorVectorBuckets

  // Filter and format file buckets
  const fileBucketResults: ExtendedSearchResult[] = useMemo(() => {
    if (!fileBuckets) return []

    const filtered = trimmedQuery
      ? fileBuckets.filter((bucket) => {
          const searchLower = trimmedQuery.toLowerCase()
          const bucketName = bucket.name?.toLowerCase() || ''
          const bucketId = bucket.id?.toLowerCase() || ''

          return bucketName.includes(searchLower) || bucketId.includes(searchLower)
        })
      : fileBuckets

    return filtered.slice(0, 10).map((bucket) => {
      const displayName = bucket.name || bucket.id || 'Untitled Bucket'
      const visibility = bucket.public ? 'Public' : 'Private'
      const description = `File bucket • ${visibility}`

      return {
        id: `file-bucket-${bucket.id || bucket.name}`,
        name: displayName,
        description,
        bucketType: 'file' as const,
        bucket,
      }
    })
  }, [fileBuckets, trimmedQuery])

  // Filter and format analytics buckets
  const analyticsBucketResults: ExtendedSearchResult[] = useMemo(() => {
    if (!analyticsBuckets) return []

    const filtered = trimmedQuery
      ? analyticsBuckets.filter((bucket) => {
          const searchLower = trimmedQuery.toLowerCase()
          const bucketName = bucket.name?.toLowerCase() || ''

          return bucketName.includes(searchLower)
        })
      : analyticsBuckets

    return filtered.slice(0, 10).map((bucket) => {
      const displayName = bucket.name || 'Untitled Bucket'
      const description = 'Analytics bucket'

      return {
        id: `analytics-bucket-${bucket.name}`,
        name: displayName,
        description,
        bucketType: 'analytics' as const,
        bucket,
      }
    })
  }, [analyticsBuckets, trimmedQuery])

  // Filter and format vector buckets
  const vectorBucketResults: ExtendedSearchResult[] = useMemo(() => {
    if (!vectorBuckets) return []

    const filtered = trimmedQuery
      ? vectorBuckets.filter((bucket) => {
          const searchLower = trimmedQuery.toLowerCase()
          const bucketName = bucket.vectorBucketName?.toLowerCase() || ''

          return bucketName.includes(searchLower)
        })
      : vectorBuckets

    return filtered.slice(0, 10).map((bucket) => {
      const displayName = bucket.vectorBucketName || 'Untitled Bucket'
      const description = 'Vector bucket'

      return {
        id: `vector-bucket-${bucket.vectorBucketName}`,
        name: displayName,
        description,
        bucketType: 'vector' as const,
        bucket,
      }
    })
  }, [vectorBuckets, trimmedQuery])

  // Combine all bucket types
  const allResults: ExtendedSearchResult[] = useMemo(() => {
    return [...fileBucketResults, ...analyticsBucketResults, ...vectorBucketResults].slice(0, 20)
  }, [fileBucketResults, analyticsBucketResults, vectorBucketResults])

  const getRoute = useCallback(
    (result: SearchResult) => {
      if (!projectRef) return `/project/${projectRef}/storage/files` as `/${string}`

      const extendedResult = result as ExtendedSearchResult

      if (extendedResult.bucketType && extendedResult.bucket) {
        const bucketType = extendedResult.bucketType

        if (bucketType === 'file') {
          const fileBucket = extendedResult.bucket as Bucket
          return `/project/${projectRef}/storage/files/buckets/${encodeURIComponent(fileBucket.name)}` as `/${string}`
        }

        if (bucketType === 'analytics') {
          const analyticsBucket = extendedResult.bucket as AnalyticsBucket
          return `/project/${projectRef}/storage/analytics/buckets/${encodeURIComponent(analyticsBucket.name)}` as `/${string}`
        }

        if (bucketType === 'vector') {
          const vectorBucket = extendedResult.bucket as { vectorBucketName: string }
          return `/project/${projectRef}/storage/vectors/buckets/${encodeURIComponent(vectorBucket.vectorBucketName)}` as `/${string}`
        }
      }

      // Fallback
      return `/project/${projectRef}/storage/files` as `/${string}`
    },
    [projectRef]
  )

  if (isLoading) {
    return <SkeletonResults />
  }

  if (isError) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
        <Storage className="h-6 w-6" strokeWidth={1.5} />
        <p className="text-sm">Failed to load storage buckets</p>
      </div>
    )
  }

  if (allResults.length === 0) {
    return <EmptyState icon={Storage} label="Storage" query={query} />
  }

  return (
    <ResultsList
      results={allResults}
      icon={Storage}
      getRoute={getRoute}
    />
  )
}
