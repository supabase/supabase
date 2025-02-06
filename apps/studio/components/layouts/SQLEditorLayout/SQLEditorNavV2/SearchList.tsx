import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { useParams } from 'common'
import InfiniteList from 'components/ui/InfiniteList'
import { useContentCountQuery } from 'data/content/content-count-query'
import { useContentInfiniteQuery } from 'data/content/content-infinite-query'
import { Content } from 'data/content/content-query'
import { SNIPPET_PAGE_LIMIT } from 'data/content/sql-folders-query'
import { cn, SQL_ICON } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

interface SearchListProps {
  search: string
}

export const SearchList = ({ search }: SearchListProps) => {
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

  const { data: count, isLoading: isLoadingCount } = useContentCountQuery(
    {
      projectRef,
      cumulative: true,
      type: 'sql',
      name: search,
    },
    { keepPreviousData: true }
  )
  const totalNumber = (count as unknown as { count: number })?.count ?? 0

  const snippets = useMemo(() => data?.pages.flatMap((page) => page.content), [data?.pages])

  return (
    <div className="flex flex-col flex-grow">
      {isLoading ? (
        <div className="px-4 py-1 pb-2.5">
          <Loader2 className="animate-spin" size={14} />
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
          ItemComponent={(props) => <SearchListItem snippet={props.item} />}
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

const SearchListItem = ({ snippet }: { snippet: Content }) => {
  const { ref, id } = useParams()
  const isSelected = snippet.id === id
  return (
    <Link
      className={cn(
        'h-full flex items-center gap-x-3 pl-4 hover:bg-control transition',
        isSelected && '!bg-selection [&>svg]:fill-foreground [&>p]:text-foreground'
      )}
      href={`/project/${ref}/sql/${snippet.id}`}
    >
      <SQL_ICON
        size={16}
        strokeWidth={1.5}
        className="w-5 h-5 -ml-0.5 transition-colors fill-foreground-muted group-aria-selected:fill-foreground"
      />
      <p className="transition text-sm text-foreground-light truncate">{snippet.name}</p>
    </Link>
  )
}
