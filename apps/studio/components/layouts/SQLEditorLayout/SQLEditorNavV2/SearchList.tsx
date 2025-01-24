import Link from 'next/link'
import { useMemo } from 'react'

import { useParams } from 'common'
import InfiniteList from 'components/ui/InfiniteList'
import { useContentCountQuery } from 'data/content/content-count-query'
import { useContentInfiniteQuery } from 'data/content/content-infinite-query'
import { SNIPPET_PAGE_LIMIT } from 'data/content/sql-folders-query'
import { SQL_ICON } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

interface SearchListProps {
  search: string
  onSelectSnippet: () => void
}

export const SearchList = ({ search, onSelectSnippet }: SearchListProps) => {
  const { ref: projectRef } = useParams()

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useContentInfiniteQuery(
      {
        projectRef,
        type: 'sql',
        limit: SNIPPET_PAGE_LIMIT,
        name: search.length === 0 ? undefined : search,
      },
      { keepPreviousData: true }
    )

  const { data: count, isLoading: isLoadingCount } = useContentCountQuery({
    projectRef,
    type: 'sql',
    name: search,
  })
  const { private: _private, shared, favorites } = count || { private: 0, shared: 0, favorites: 0 }
  const totalNumber = _private + shared - favorites

  const snippets = useMemo(() => data?.pages.flatMap((page) => page.content), [data?.pages])

  return (
    <div className="flex flex-col flex-grow">
      {isLoadingCount ? (
        <div className="px-4 pb-2">
          <ShimmeringLoader className="py-2.5" />
        </div>
      ) : !!count ? (
        <p className="px-4 pb-2 text-sm text-foreground-lighter">
          {totalNumber} result{totalNumber > 1 ? 's' : ''} found
        </p>
      ) : null}
      {isLoading ? (
        <div className="px-4 flex flex-col gap-y-1">
          <ShimmeringLoader className="py-2.5" />
          <ShimmeringLoader className="py-2.5 w-5/6" />
          <ShimmeringLoader className="py-2.5 w-3/4" />
        </div>
      ) : (
        <InfiniteList
          items={snippets}
          ItemComponent={(props) => (
            <Link
              className="h-full flex items-center gap-x-3 pl-4 hover:bg-control"
              href={`/project/${projectRef}/sql/${props.item.id}`}
              onClick={() => onSelectSnippet()}
            >
              <SQL_ICON
                size={16}
                strokeWidth={1.5}
                className="w-5 h-5 -ml-0.5 transition-colors fill-foreground-muted group-aria-selected:fill-foreground"
              />
              <p className="text-sm text-foreground-light truncate">{props.item.name}</p>
            </Link>
          )}
          itemProps={{}}
          getItemSize={() => 28}
          hasNextPage={hasNextPage}
          isLoadingNextPage={isFetchingNextPage}
          onLoadNextPage={() => fetchNextPage()}
        />
      )}
    </div>
  )
}
