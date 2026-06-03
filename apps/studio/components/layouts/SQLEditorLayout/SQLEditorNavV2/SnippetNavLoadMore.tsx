import { Button, cn } from 'ui'

import { getSqlEditorNavItemPaddingClass } from './SqlEditorNavItem'

interface SnippetNavLoadMoreProps {
  depth?: number
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
}

export function SnippetNavLoadMore({
  depth = 1,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: SnippetNavLoadMoreProps) {
  if (!hasNextPage || typeof fetchNextPage !== 'function') return null

  return (
    <div className={cn('py-1.5 pr-2', getSqlEditorNavItemPaddingClass(depth))}>
      <Button
        type="outline"
        size="tiny"
        block
        loading={isFetchingNextPage}
        disabled={isFetchingNextPage}
        onClick={fetchNextPage}
      >
        Load More
      </Button>
    </div>
  )
}
