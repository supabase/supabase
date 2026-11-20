export type AllowedBucketType = 'all' | 'public' | 'private'

export type BucketsTablePaginationProps = {
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}
