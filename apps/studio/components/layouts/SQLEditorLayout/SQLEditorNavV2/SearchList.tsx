import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { useParams } from 'common'
import InfiniteList from 'components/ui/InfiniteList'
import { useContentCountQuery } from 'data/content/content-count-query'
import { useContentIdQuery } from 'data/content/content-id-query'
import { useContentInfiniteQuery } from 'data/content/content-infinite-query'
import { Content } from 'data/content/content-query'
import { SNIPPET_PAGE_LIMIT } from 'data/content/sql-folders-query'
import { SqlSnippets } from 'types'
import {
  cn,
  CodeBlock,
  HoverCard_Shadcn_,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
  ScrollArea,
  SQL_ICON,
} from 'ui'
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
          ItemComponent={(props) => (
            <SearchListItem snippet={props.item} onSelectSnippet={onSelectSnippet} />
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

const SearchListItem = ({
  snippet,
  onSelectSnippet,
}: {
  snippet: Content
  onSelectSnippet: () => void
}) => {
  const { ref } = useParams()
  return (
    <HoverCard_Shadcn_ openDelay={500} closeDelay={100}>
      <HoverCardTrigger_Shadcn_>
        <Link
          className="h-full flex items-center gap-x-3 pl-4 hover:bg-control"
          href={`/project/${ref}/sql/${snippet.id}`}
          onClick={() => onSelectSnippet()}
        >
          <SQL_ICON
            size={16}
            strokeWidth={1.5}
            className="w-5 h-5 -ml-0.5 transition-colors fill-foreground-muted group-aria-selected:fill-foreground"
          />
          <p className="text-sm text-foreground-light truncate">{snippet.name}</p>
        </Link>
      </HoverCardTrigger_Shadcn_>
      <HoverCardContent_Shadcn_ side="right" className="p-0 w-[300px]">
        <SearchItemListHover id={snippet.id} />
      </HoverCardContent_Shadcn_>
    </HoverCard_Shadcn_>
  )
}

const SearchItemListHover = ({ id }: { id: string }) => {
  const { ref } = useParams()
  const { data, isLoading } = useContentIdQuery({ projectRef: ref, id })
  const sql = (data?.content as SqlSnippets.Content)?.sql ?? ''
  const newLines = (sql.match(new RegExp('\n', 'g')) || []).length

  return (
    <div>
      {isLoading ? (
        <div className="p-2">
          <ShimmeringLoader />
        </div>
      ) : sql.length === 0 ? (
        <div className="px-4 py-2">
          <p className="text-xs text-foreground-lighter">Snippet is empty</p>
        </div>
      ) : (
        <ScrollArea className={cn(newLines > 6 ? 'h-[140px]' : '')}>
          <CodeBlock
            hideLineNumbers
            language="sql"
            value={sql}
            className={cn(
              'border-0 py-0 px-3 max-w-full prose dark:prose-dark text-xs',
              '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
            )}
          />
        </ScrollArea>
      )}
    </div>
  )
}
