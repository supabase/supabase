import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ExplorerNavResourceWrapper } from './ExplorerLayout.constants'
import { ExplorerNavItem } from './ExplorerNavItem'
import { useExplorerDeleteItem } from './ExplorerProvider'
import {
  InfiniteListDefault,
  LoaderForIconMenuItems,
  type RowComponentBaseProps,
} from '@/components/ui/InfiniteList'
import {
  NotebookRow,
  useNotebooksInfiniteQuery,
} from '@/data/content/notebooks/notebooks-infinite-query'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

const NOTEBOOK_ROW_HEIGHT = 28

type NotebookListItemProps = RowComponentBaseProps<NotebookRow> & {
  projectRef: string | undefined
  activeNotebookId: string | undefined
  onSelectDelete: (item: { id: string; type: 'notebook' | 'chat'; name: string }) => void
}

const NotebookListItem = ({
  item: notebook,
  style,
  projectRef,
  activeNotebookId,
  onSelectDelete,
}: NotebookListItemProps) => {
  const isActive = activeNotebookId === notebook.id
  const tabs = useTabsStateSnapshot()

  return (
    <ExplorerNavItem
      name={notebook.name}
      type="notebook"
      isActive={isActive}
      style={style}
      href={`/project/${projectRef}/explorer/notebook/${notebook.id}`}
      onDoubleClick={() => tabs.makeTabPermanent(createTabId('notebook', { id: notebook.id }))}
      onSelectDelete={() =>
        onSelectDelete({ id: notebook.id, type: 'notebook', name: notebook.name })
      }
    />
  )
}

export const ExplorerNavNotebooks = () => {
  const router = useRouter()
  const { ref, id } = useParams()
  const { onSelectDelete } = useExplorerDeleteItem()

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

  const itemProps = useMemo(
    () => ({ projectRef: ref, activeNotebookId, onSelectDelete }),
    [ref, activeNotebookId, onSelectDelete]
  )

  return (
    <ExplorerNavResourceWrapper type="notebook" search={search} setSearch={setSearch}>
      <div className="flex flex-1 min-h-0 flex-col p-3">
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
