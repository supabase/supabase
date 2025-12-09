import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

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
import { storageKeys } from './keys'

export type BucketsVariables = { projectRef?: string }

export type Bucket = components['schemas']['StorageBucketResponse']

export type BucketType = Bucket['type']

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

export type BucketsData = Awaited<ReturnType<typeof getBuckets>>
export type BucketsWithPaginationData = Awaited<ReturnType<typeof getBucketsPaginated>>
export type BucketsError = ResponseError

export const useBucketsQuery = <TData = BucketsData>(
  { projectRef }: BucketsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<BucketsData, BucketsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<BucketsData, BucketsError, TData>({
    queryKey: storageKeys.buckets(projectRef),
    queryFn: ({ signal }) => getBuckets({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
    retry: shouldRetryBucketsQuery,
  })
}

export const usePaginatedBucketsQuery = <TData = BucketsWithPaginationData>(
  { projectRef, ...params }: Omit<BucketsListPaginatedVariables, 'page'>,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<BucketsWithPaginationData, BucketsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const { keepPreviousData, ...restOptions } = options
  const resolvedKeepPreviousData = keepPreviousData ?? true

  return useInfiniteQuery<BucketsWithPaginationData, BucketsError, TData>({
    queryKey: storageKeys.bucketsList(projectRef, params),
    queryFn: ({ signal, pageParam }) =>
      getBucketsPaginated({ projectRef, page: pageParam, ...params }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    getNextPageParam: (lastPage, pages) => {
      const nextPageNumber = pages.length
      const limit = params.limit ?? DEFAULT_PAGE_SIZE

      const lastPageCount = lastPage.length
      if (lastPageCount < limit) return undefined
      return nextPageNumber
    },
    ...restOptions,
    keepPreviousData: resolvedKeepPreviousData,
    retry: shouldRetryBucketsQuery,
  })
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
