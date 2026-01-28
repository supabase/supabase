'use client'

import { useDebounce } from '@uidotdev/usehooks'
import { Loader2 } from 'lucide-react'
import { useCallback, useMemo } from 'react'

import { useParams } from 'common'
import {
  useIsAnalyticsBucketsEnabled,
  useIsVectorBucketsEnabled,
} from 'data/config/project-storage-config-query'
import {
  useAnalyticsBucketsQuery,
  type AnalyticsBucket,
} from 'data/storage/analytics-buckets-query'
import {
  useBucketNumberEstimateQuery,
  usePaginatedBucketsQuery,
  type Bucket,
} from 'data/storage/buckets-query'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'
import { AnalyticsBucket as AnalyticsBucketIcon, FilesBucket, Storage, VectorBucket } from 'icons'
import {
  EmptyState,
  ResultsList,
  SkeletonResults,
  type SearchResult,
} from './ContextSearchResults.shared'

interface StorageSearchResultsProps {
  query: string
}

type ExtendedSearchResult = SearchResult & {
  bucketType?: 'file' | 'analytics' | 'vector'
  bucket?: unknown
}

function filterBuckets<T>(
  buckets: T[] | null | undefined,
  query: string,
  filterFn: (bucket: T, searchLower: string) => boolean,
  mapFn: (bucket: T) => ExtendedSearchResult
): ExtendedSearchResult[] {
  if (!buckets) return []

  const trimmedQuery = query.trim()
  const filtered = trimmedQuery
    ? buckets.filter((bucket) => filterFn(bucket, trimmedQuery.toLowerCase()))
    : buckets

  return filtered.slice(0, 10).map(mapFn)
}

export function StorageSearchResults({ query }: StorageSearchResultsProps) {
  const { ref: projectRef } = useParams()

  const isAnalyticsBucketsEnabled = useIsAnalyticsBucketsEnabled({ projectRef })
  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef })

  // Debounce the search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query.trim(), 300)

  const {
    data: fileBucketsData,
    isLoading: isLoadingFileBuckets,
    isError: isErrorFileBuckets,
  } = usePaginatedBucketsQuery(
    {
      projectRef: projectRef ?? undefined,
      limit: 10,
      search: debouncedQuery.length > 0 ? debouncedQuery : undefined,
    },
    {
      enabled: !!projectRef,
    }
  )
  const fileBuckets = useMemo(
    () => fileBucketsData?.pages.flatMap((page) => page) ?? [],
    [fileBucketsData]
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
      enabled: !!projectRef && isAnalyticsBucketsEnabled,
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
      enabled: !!projectRef && isVectorBucketsEnabled,
    }
  )

  const vectorBuckets = useMemo(() => vectorBucketsData?.vectorBuckets ?? [], [vectorBucketsData])

  const { data: fileBucketsEstimate } = useBucketNumberEstimateQuery({
    projectRef,
  })

  const isLoading =
    isLoadingFileBuckets ||
    (isAnalyticsBucketsEnabled && isLoadingAnalyticsBuckets) ||
    (isVectorBucketsEnabled && isLoadingVectorBuckets)
  const isError =
    isErrorFileBuckets ||
    (isAnalyticsBucketsEnabled && isErrorAnalyticsBuckets) ||
    (isVectorBucketsEnabled && isErrorVectorBuckets)

  const fileBucketResults: ExtendedSearchResult[] = useMemo(() => {
    // Server-side search is already applied, no need for client-side filtering
    if (!fileBuckets) return []

    return fileBuckets.map((bucket) => {
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
  }, [fileBuckets])

  const analyticsBucketResults: ExtendedSearchResult[] = useMemo(() => {
    return filterBuckets(
      analyticsBuckets,
      debouncedQuery, // Use debounced query for consistency
      (bucket, searchLower) => {
        const bucketName = bucket.name?.toLowerCase() || ''
        return bucketName.includes(searchLower)
      },
      (bucket) => {
        const displayName = bucket.name || 'Untitled Bucket'
        const description = 'Analytics bucket'

        return {
          id: `analytics-bucket-${bucket.name}`,
          name: displayName,
          description,
          bucketType: 'analytics' as const,
          bucket,
        }
      }
    )
  }, [analyticsBuckets, debouncedQuery])

  const vectorBucketResults: ExtendedSearchResult[] = useMemo(() => {
    return filterBuckets(
      vectorBuckets,
      debouncedQuery, // Use debounced query for consistency
      (bucket, searchLower) => {
        const bucketName = bucket.vectorBucketName?.toLowerCase() || ''
        return bucketName.includes(searchLower)
      },
      (bucket) => {
        const displayName = bucket.vectorBucketName || 'Untitled Bucket'
        const description = 'Vector bucket'

        return {
          id: `vector-bucket-${bucket.vectorBucketName}`,
          name: displayName,
          description,
          bucketType: 'vector' as const,
          bucket,
        }
      }
    )
  }, [vectorBuckets, debouncedQuery])

  const allResults: ExtendedSearchResult[] = useMemo(() => {
    const results = [fileBucketResults]
    if (isAnalyticsBucketsEnabled) {
      results.push(analyticsBucketResults)
    }
    if (isVectorBucketsEnabled) {
      results.push(vectorBucketResults)
    }
    return results.flat().slice(0, 20)
  }, [
    fileBucketResults,
    analyticsBucketResults,
    vectorBucketResults,
    isAnalyticsBucketsEnabled,
    isVectorBucketsEnabled,
  ])

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

      return `/project/${projectRef}/storage/files` as `/${string}`
    },
    [projectRef]
  )

  const totalBucketsEstimate = useMemo(() => {
    const fileBucketCount = fileBucketsEstimate ?? 0
    const analyticsBucketCount = isAnalyticsBucketsEnabled ? analyticsBuckets?.length ?? 0 : 0
    const vectorBucketCount = isVectorBucketsEnabled ? vectorBuckets?.length ?? 0 : 0

    return fileBucketCount + analyticsBucketCount + vectorBucketCount
  }, [
    fileBucketsEstimate,
    analyticsBuckets?.length,
    vectorBuckets?.length,
    isAnalyticsBucketsEnabled,
    isVectorBucketsEnabled,
  ])

  const getIcon = useCallback((result: SearchResult) => {
    const extendedResult = result as ExtendedSearchResult
    if (extendedResult.bucketType === 'file') return FilesBucket
    if (extendedResult.bucketType === 'analytics') return AnalyticsBucketIcon
    if (extendedResult.bucketType === 'vector') return VectorBucket
    return Storage
  }, [])

  const renderFooter = () => (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between min-h-9 h-9 px-4 border-t bg-surface-200 text-xs text-foreground-light z-10">
      <div className="flex items-center gap-x-2">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading...
          </span>
        ) : (
          <span>
            Total: {totalBucketsEstimate.toLocaleString()} bucket
            {totalBucketsEstimate !== 1 ? 's' : ''} (estimate)
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
          <EmptyState icon={Storage} label="Storage" query={debouncedQuery} />
        </div>
        {renderFooter()}
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResultsList
          results={allResults}
          icon={Storage}
          getIcon={getIcon}
          getRoute={getRoute}
          className="pb-9"
        />
      </div>
      {renderFooter()}
    </div>
  )
}
