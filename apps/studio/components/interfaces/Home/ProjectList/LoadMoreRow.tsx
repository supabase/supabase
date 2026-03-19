import { useIntersectionObserver } from '@uidotdev/usehooks'
import { useEffect } from 'react'

import { cn, Skeleton, TableCell, TableRow } from 'ui'
import { ShimmeringCard } from './ShimmeringCard'

interface LoadMoreRowProps {
  type?: 'card' | 'table'
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

export const LoadMoreRows = ({ type, isFetchingNextPage, fetchNextPage }: LoadMoreRowProps) => {
  const [sentinelRef, entry] = useIntersectionObserver({
    threshold: 0,
    rootMargin: '200px 0px 200px 0px',
  })

  useEffect(() => {
    if (entry?.isIntersecting && !isFetchingNextPage) {
      fetchNextPage?.()
    }
  }, [entry?.isIntersecting, isFetchingNextPage, fetchNextPage])

  if (type === 'card') {
    return (
      <ul
        ref={sentinelRef}
        className={cn(
          'grid grid-cols-1 gap-2 md:gap-4',
          'sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 pb-6'
        )}
      >
        {[...Array(2)].map((_, i) => (
          <ShimmeringCard key={i} />
        ))}
      </ul>
    )
  }

  return (
    <TableRow ref={sentinelRef}>
      <TableCell>
        <Skeleton className="bg-surface-400 h-4 w-32"></Skeleton>
      </TableCell>
      <TableCell>
        <Skeleton className="bg-surface-400 h-4 w-16"></Skeleton>
      </TableCell>
      <TableCell>
        <Skeleton className="bg-surface-400 h-4 w-20"></Skeleton>
      </TableCell>
      <TableCell>
        <Skeleton className="bg-surface-400 h-4 w-20"></Skeleton>
      </TableCell>
      <TableCell>
        <Skeleton className="bg-surface-400 h-4 w-24"></Skeleton>
      </TableCell>
    </TableRow>
  )
}
