import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import DownloadSnippetModal from 'components/interfaces/SQLEditor/DownloadSnippetModal'
import RenameQueryModal from 'components/interfaces/SQLEditor/RenameQueryModal'
import { useContentCountQuery } from 'data/content/content-count-query'
import { useContentInfiniteQuery } from 'data/content/content-infinite-query'
import { Snippet, SNIPPET_PAGE_LIMIT } from 'data/content/sql-folders-query'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import { TreeView } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { DeleteSnippetsModal } from './DeleteSnippetsModal'
import { formatFolderResponseForTreeView, getLastItemIds } from './SQLEditorNav.utils'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'
import { ShareSnippetModal } from './ShareSnippetModal'
import { UnshareSnippetModal } from './UnshareSnippetModal'

interface SearchListProps {
  search: string
}

export const SearchList = ({ search }: SearchListProps) => {
  const { id } = useParams()
  const tabs = useTabsStateSnapshot()
  const { ref: projectRef } = useParams()

  const [selectedSnippetToShare, setSelectedSnippetToShare] = useState<Snippet>()
  const [selectedSnippetToUnshare, setSelectedSnippetToUnshare] = useState<Snippet>()
  const [selectedSnippetToDownload, setSelectedSnippetToDownload] = useState<Snippet>()
  const [selectedSnippetToRename, setSelectedSnippetToRename] = useState<Snippet>()
  const [selectedSnippetToDelete, setSelectedSnippetToDelete] = useState<Snippet>()

  const {
    data,
    isPending: isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useContentInfiniteQuery(
    {
      projectRef,
      type: 'sql',
      limit: SNIPPET_PAGE_LIMIT,
      name: search.length === 0 ? undefined : search,
    },
    { placeholderData: keepPreviousData }
  )

  const { data: count, isPending: isLoadingCount } = useContentCountQuery(
    {
      projectRef,
      type: 'sql',
      name: search,
    },
    { placeholderData: keepPreviousData }
  )
  const totalNumber = count ? count.private + count.shared : 0

  const snippets = useMemo(
    // [Joshen] Set folder_id to null to ensure flat list
    () => data?.pages.flatMap((page) => page.content.map((x) => ({ ...x, folder_id: null }))),
    [data?.pages]
  )
  const treeState = formatFolderResponseForTreeView({ folders: [], contents: snippets as any })

  const snippetsLastItemIds = useMemo(() => getLastItemIds(treeState), [treeState])

  return (
    <>
      <div className="flex flex-col flex-grow">
        {isLoadingCount ? (
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
          <TreeView
            multiSelect
            togglableSelect
            clickAction="EXCLUSIVE_SELECT"
            data={treeState}
            aria-label="private-snippets"
            nodeRenderer={({ element, ...props }) => {
              const isOpened = Object.values(tabs.tabsMap).some(
                (tab) => tab.metadata?.sqlId === element.metadata?.id
              )
              const tabId = createTabId('sql', {
                id: element?.metadata?.id as unknown as Snippet['id'],
              })
              const isPreview = tabs.previewTabId === tabId
              const isActive = !isPreview && element.metadata?.id === id
              const visibility =
                element.metadata?.visibility === 'user'
                  ? 'Private'
                  : element.metadata?.visibility === 'project'
                    ? 'Shared'
                    : undefined

              return (
                <SQLEditorTreeViewItem
                  {...props}
                  element={{
                    ...element,
                    name: (
                      <span className="flex flex-col py-0.5">
                        <span className="truncate">{element.name}</span>
                        {!!visibility && (
                          <span className="text-foreground-lighter text-xs">{visibility}</span>
                        )}
                      </span>
                    ),
                  }}
                  nameForTitle={element.name}
                  isBranch={false}
                  isOpened={isOpened && !isPreview}
                  isSelected={isActive}
                  isPreview={isPreview}
                  isLastItem={snippetsLastItemIds.has(element.id as string)}
                  status="idle"
                  className="items-start h-[40px] [&>svg]:translate-y-0.5"
                  onSelectDelete={() => setSelectedSnippetToDelete(element.metadata as Snippet)}
                  onSelectRename={() => setSelectedSnippetToRename(element.metadata as Snippet)}
                  onSelectDownload={() => setSelectedSnippetToDownload(element.metadata as Snippet)}
                  onSelectShare={() => setSelectedSnippetToShare(element.metadata as Snippet)}
                  onSelectUnshare={() => setSelectedSnippetToUnshare(element.metadata as Snippet)}
                  hasNextPage={hasNextPage}
                  fetchNextPage={fetchNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    tabs.makeTabPermanent(tabId)
                  }}
                />
              )
            }}
          />
        )}
      </div>

      <ShareSnippetModal
        snippet={selectedSnippetToShare}
        onClose={() => setSelectedSnippetToShare(undefined)}
      />

      <UnshareSnippetModal
        snippet={selectedSnippetToUnshare}
        onClose={() => setSelectedSnippetToUnshare(undefined)}
      />

      <DownloadSnippetModal
        id={selectedSnippetToDownload?.id ?? ''}
        visible={selectedSnippetToDownload !== undefined}
        onCancel={() => setSelectedSnippetToDownload(undefined)}
      />

      <RenameQueryModal
        snippet={selectedSnippetToRename}
        visible={!!selectedSnippetToRename}
        onCancel={() => setSelectedSnippetToRename(undefined)}
        onComplete={() => setSelectedSnippetToRename(undefined)}
      />

      <DeleteSnippetsModal
        visible={!!selectedSnippetToDelete}
        snippets={!!selectedSnippetToDelete ? [selectedSnippetToDelete] : []}
        onClose={() => setSelectedSnippetToDelete(undefined)}
      />
    </>
  )
}
