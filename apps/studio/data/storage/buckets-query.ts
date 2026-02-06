import {
  InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo } from 'react'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { MAX_RETRY_FAILURE_COUNT } from 'data/query-client'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import {
  ResponseError,
  type UseCustomInfiniteQueryOptions,
  type UseCustomQueryOptions,
} from 'types'
import { getBucketNumberEstimate, getBucketNumberEstimateKey } from './buckets-max-size-limit-query'
import { storageKeys } from './keys'

export type BucketsVariables = { projectRef?: string }

export type Bucket = components['schemas']['StorageBucketResponse']

export type BucketType = Bucket['type']

type GetBucketParams = {
  projectRef?: string
  bucketId?: string
}

async function getBucket({ projectRef, bucketId }: GetBucketParams, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await get('/platform/storage/{ref}/buckets/{id}', {
    params: {
      path: { ref: projectRef, id: bucketId },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export async function getBuckets({ projectRef }: BucketsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/storage/{ref}/buckets', {
    params: {
      path: { ref: projectRef },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type BucketSortColumn = 'id' | 'name' | 'updated_at' | 'created_at'
type BucketSortOrder = 'asc' | 'desc'

type BucketListPagination = {
  page?: number
  limit?: number
  sortColumn?: BucketSortColumn
  sortOrder?: BucketSortOrder
  search?: string
}

export type BucketsListPaginatedVariables = BucketsVariables & BucketListPagination

const DEFAULT_PAGE_SIZE = 100
const DEFAULT_SORT_COLUMN: BucketSortColumn = 'created_at'
const DEFAULT_SORT_ORDER: BucketSortOrder = 'desc'

const getBucketsPaginated = async (
  {
    projectRef,
    page = 0,
    limit = DEFAULT_PAGE_SIZE,
    sortColumn = DEFAULT_SORT_COLUMN,
    sortOrder = DEFAULT_SORT_ORDER,
    search,
  }: BucketsListPaginatedVariables,
  signal?: AbortSignal
) => {
  if (!projectRef) throw new Error('projectRef is required')

  const offset = page * limit
  const trimmedSearch = search?.trim()
  const resolvedSearch = !!trimmedSearch && trimmedSearch.length > 0 ? trimmedSearch : undefined

  const { data, error } = await get('/platform/storage/{ref}/buckets', {
    params: {
      path: { ref: projectRef },
      query: {
        limit,
        offset,
        sortColumn,
        sortOrder,
        search: resolvedSearch,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type BucketData = Awaited<ReturnType<typeof getBucket>>
export type BucketsData = Awaited<ReturnType<typeof getBuckets>>
export type BucketsWithPaginationData = Awaited<ReturnType<typeof getBucketsPaginated>>
export type BucketsError = ResponseError

export const useBucketQuery = <TData = BucketData>(
  { projectRef, bucketId }: GetBucketParams,
  { enabled = true, ...options }: UseCustomQueryOptions<BucketData, BucketsError, TData>
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<BucketData, BucketsError, TData>({
    queryKey: storageKeys.bucket(projectRef, bucketId),
    queryFn: ({ signal }) => getBucket({ projectRef, bucketId }, signal),
    enabled: enabled && !!bucketId && isActive,
    ...options,
    retry: shouldRetryBucketsQuery,
  })
}

export const useBucketNumberEstimateQuery = (
  { projectRef }: BucketsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<number | undefined, ResponseError> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useQuery<number | undefined, ResponseError>({
    // Query remains functionally the same even if connectionString changes
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: getBucketNumberEstimateKey(projectRef),
    queryFn: () =>
      getBucketNumberEstimate({
        projectRef,
        connectionString,
      }),
    enabled: enabled && !!projectRef,
    ...options,
  })
}

export const usePaginatedBucketsQuery = <TData = BucketsWithPaginationData>(
  { projectRef, ...params }: Omit<BucketsListPaginatedVariables, 'page'>,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    BucketsWithPaginationData,
    BucketsError,
    InfiniteData<TData>,
    readonly unknown[],
    number
  > = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const { placeholderData, ...restOptions } = options
  const resolvedPlaceholderData = placeholderData ?? keepPreviousData

  return useInfiniteQuery({
    queryKey: storageKeys.bucketsList(projectRef, params),
    queryFn: ({ signal, pageParam }) =>
      getBucketsPaginated({ projectRef, page: pageParam, ...params }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextPageNumber = pages.length
      const limit = params.limit ?? DEFAULT_PAGE_SIZE

      const lastPageCount = lastPage.length
      if (lastPageCount < limit) return undefined
      return nextPageNumber
    },
    ...restOptions,
    placeholderData: resolvedPlaceholderData,
    retry: shouldRetryBucketsQuery,
  })
}

/**
 * Tries to get the bucket info from the cache first. If not found, fetches
 * from remote by name.
 */
export const useBucketInfoQueryPreferCached = (bucketId?: string, projectRef?: string) => {
  const queryClient = useQueryClient()

  const cachedBucketInfo = useMemo(() => {
    if (!bucketId) return undefined

    const bucketsPages = queryClient.getQueryData(storageKeys.bucketsList(projectRef)) as
      | InfiniteData<Bucket[]>
      | undefined
    const buckets = bucketsPages?.pages.flatMap((page) => page) ?? []
    return buckets.find((b) => b.name === bucketId)
  }, [bucketId, projectRef, queryClient])

  const shouldFetchBucketInfo = !!bucketId && !cachedBucketInfo
  const { data: remoteBucketInfo } = useBucketQuery(
    {
      projectRef,
      bucketId,
    },
    {
      enabled: shouldFetchBucketInfo,
    }
  )

  if (!bucketId) return undefined
  return cachedBucketInfo ?? remoteBucketInfo
}

const shouldRetryBucketsQuery = (failureCount: number, error: unknown) => {
  if (error instanceof ResponseError) {
    if (
      error.message.includes('Missing tenant config') ||
      error.message.includes('Project has no active API keys')
    ) {
      return false
    }
  }

  if (failureCount < MAX_RETRY_FAILURE_COUNT) {
    return true
  }

  return false
}
