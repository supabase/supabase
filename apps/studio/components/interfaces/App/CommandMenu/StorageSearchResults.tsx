'use client'

import { useMemo, useCallback } from 'react'
import { Storage } from 'icons'
import { Loader2 } from 'lucide-react'
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

  const vectorBuckets = useMemo(() => vectorBucketsData?.vectorBuckets ?? [], [vectorBucketsData])

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
      if (!projectRef) return '/storage/files' as `/${string}`

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

  const totalBuckets =
    (fileBuckets?.length ?? 0) + (analyticsBuckets?.length ?? 0) + (vectorBuckets?.length ?? 0)

  const renderFooter = () => (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between min-h-9 h-9 px-4 border-t bg-surface-200 text-xs text-foreground-light z-10">
      <div className="flex items-center gap-x-2">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading...
          </span>
        ) : (
          <span>
            Total: {totalBuckets.toLocaleString()} bucket{totalBuckets !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <SkeletonResults />
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
            <Storage className="h-6 w-6" strokeWidth={1.5} />
            <p className="text-sm">Failed to load storage buckets</p>
          </div>
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (allResults.length === 0) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <EmptyState icon={Storage} label="Storage" query={query} />
        </div>
        {renderFooter()}
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResultsList results={allResults} icon={Storage} getRoute={getRoute} className="pb-9" />
      </div>
      {renderFooter()}
    </div>
  )
}
