import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { NotebookText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useMemo, useState } from 'react'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ExplorerNavResourceWrapper, rowClassName } from './ExplorerLayout.constants'
import {
  InfiniteListDefault,
  LoaderForIconMenuItems,
  type RowComponentBaseProps,
} from '@/components/ui/InfiniteList'
import {
  NotebookRow,
  useNotebooksInfiniteQuery,
} from '@/data/content/notebooks/notebooks-infinite-query'

const NOTEBOOK_ROW_HEIGHT = 28

type NotebookListItemProps = RowComponentBaseProps<NotebookRow> & {
  projectRef: string | undefined
  activeNotebookId: string | undefined
}

const NotebookListItem = ({
  item: notebook,
  style,
  projectRef,
  activeNotebookId,
}: NotebookListItemProps) => {
  const isActive = activeNotebookId === notebook.id

  return (
    <Link
      href={`/project/${projectRef}/explorer/notebook/${notebook.id}`}
      className={rowClassName(isActive)}
      style={style}
    >
      <NotebookText size={14} className={cn('shrink-0', isActive && 'text-foreground')} />
      <span className="truncate text-left">{notebook.name}</span>
    </Link>
  )
}

export const ExplorerNavNotebooks = ({ header }: { header: ReactNode }) => {
  const router = useRouter()
  const { ref, id } = useParams()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const {
    data: notebooksData,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotebooksInfiniteQuery({
    projectRef: ref,
    limit: 100,
    name: search.length === 0 ? search : debouncedSearch,
  })

  const notebooks = useMemo(() => {
    const items = notebooksData?.pages.flatMap((page) => page.content) ?? []
    return items
  }, [notebooksData?.pages])

  const activeNotebookId = router.pathname.includes('/explorer/notebook/') ? id : undefined

  const itemProps = useMemo(() => ({ projectRef: ref, activeNotebookId }), [ref, activeNotebookId])

  return (
    <ExplorerNavResourceWrapper
      type="notebook"
      header={header}
      search={search}
      setSearch={setSearch}
    >
      <div className="flex flex-1 min-h-0 flex-col px-4 pb-3">
        {isPending ? (
          <GenericSkeletonLoader />
        ) : notebooks.length === 0 ? (
          <p className="px-2 py-2 text-xs text-foreground-lighter">
            {search ? 'No notebooks found' : 'No notebooks created yet'}
          </p>
        ) : (
          <InfiniteListDefault
            className="h-full w-full"
            items={notebooks}
            itemProps={itemProps}
            ItemComponent={NotebookListItem}
            LoaderComponent={LoaderForIconMenuItems}
            getItemKey={(index) => notebooks[index]?.id ?? `notebook-${index}`}
            getItemSize={() => NOTEBOOK_ROW_HEIGHT}
            gap={1}
            hasNextPage={hasNextPage}
            isLoadingNextPage={isFetchingNextPage}
            onLoadNextPage={fetchNextPage}
          />
        )}
      </div>
    </ExplorerNavResourceWrapper>
  )
}
