import { useIntersectionObserver } from '@uidotdev/usehooks'
import { VirtualizedTableCell, VirtualizedTableRow } from 'components/ui/VirtualizedTable'
import { useEffect, type ReactNode } from 'react'
import { TableCell, TableRow } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'
import type { BucketsTablePaginationProps } from './BucketsTable.types'

type LoadMoreRowProps = {
  mode: 'standard' | 'virtualized'
  colSpan: number
} & BucketsTablePaginationProps

export const LoadMoreRow = ({
  mode,
  colSpan,

  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: LoadMoreRowProps): ReactNode => {
  const [sentinelRef, entry] = useIntersectionObserver({
    threshold: 0,
    rootMargin: '200px 0px 200px 0px',
  })

  useEffect(() => {
    if (entry?.isIntersecting && hasMore && !isLoadingMore) {
      onLoadMore?.()
    }
  }, [entry?.isIntersecting, hasMore, isLoadingMore, onLoadMore])

  if (!hasMore && !isLoadingMore) return null

  const RowComponent = mode === 'standard' ? TableRow : VirtualizedTableRow
  const CellComponent = mode === 'standard' ? TableCell : VirtualizedTableCell

  return (
    <RowComponent ref={sentinelRef}>
      {Array.from({ length: colSpan }, (_, idx) => (
        <CellComponent key={idx}>
          {idx !== 0 && idx !== colSpan - 1 && <ShimmeringLoader className="w-3/4" />}
        </CellComponent>
      ))}
    </RowComponent>
  )
}
