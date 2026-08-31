import { keepPreviousData } from '@tanstack/react-query'
import { useFlag, useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DeleteSnippetsModal } from './DeleteSnippetsModal'
import { ShareSnippetModal } from './ShareSnippetModal'
import { formatFolderResponseForTreeView, getLastItemIds } from './SQLEditorNav.utils'
import { SqlSnippetTree } from './SqlSnippetTree'
import { UnshareSnippetModal } from './UnshareSnippetModal'
import { DownloadSnippetModal } from '@/components/interfaces/SQLEditor/DownloadSnippetModal'
import { RenameQueryModal } from '@/components/interfaces/SQLEditor/RenameQueryModal'
import { useContentCountQuery } from '@/data/content/content-count-query'
import { Snippet } from '@/data/content/sql-folders-query'
import { useSqlSnippetsQuery } from '@/data/content/sql-snippets-query'

interface SearchListProps {
  search: string
}

/** Uppercase section heading shown above the Database and Logs result groups. */
const SearchGroupHeading = ({ children }: { children: string }) => (
  <p className="px-4 pb-2 pt-1 text-xs font-medium uppercase text-foreground-muted">{children}</p>
)

/**
 * Flatten paginated snippet results into the flat (folderless) tree the search view
 * renders. Keyed on `pages` (a stable reference from React Query) so the flatMap and
 * tree build run once per data change rather than on every render.
 */
function useSnippetSearchTree(pages: { contents: Snippet[] }[] | undefined) {
  return useMemo(() => {
    const flat = (pages ?? [])
      .flatMap((page) => page.contents ?? [])
      .map((snippet) => ({ ...snippet, folder_id: null }))
    const treeState = formatFolderResponseForTreeView({ folders: [], contents: flat })
    return { treeState, lastItemIds: getLastItemIds(treeState), count: flat.length }
  }, [pages])
}

export const SearchList = ({ search }: SearchListProps) => {
  const { ref: projectRef } = useParams()

  const [selectedSnippetToShare, setSelectedSnippetToShare] = useState<Snippet>()
  const [selectedSnippetToUnshare, setSelectedSnippetToUnshare] = useState<Snippet>()
  const [selectedSnippetToDownload, setSelectedSnippetToDownload] = useState<Snippet>()
  const [selectedSnippetToRename, setSelectedSnippetToRename] = useState<Snippet>()
  const [selectedSnippetToDelete, setSelectedSnippetToDelete] = useState<Snippet>()

  // Logs snippets are a separate backend and don't share the `sql` cursor, so the
  // search runs a second single-type query and renders them under their own group.
  // Gated by both flags, mirroring the nav's Logs section.
  const isLogsSourceEnabled = useFlag('sqlEditorLogsSource')
  const isOtelLogsEnabled = useFlag('otelLegacyLogs')
  const canShowLogsSection = isLogsSourceEnabled && isOtelLogsEnabled

  const searchName = search.length === 0 ? undefined : search

  const {
    data,
    isPending: isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSqlSnippetsQuery(
    { projectRef, type: 'sql', name: searchName },
    { placeholderData: keepPreviousData }
  )

  const { data: count, isPending: isLoadingCount } = useContentCountQuery(
    { projectRef, type: 'sql', name: search },
    { placeholderData: keepPreviousData }
  )

  const { data: logsCount, isPending: isLoadingLogsCount } = useContentCountQuery(
    { projectRef, type: 'log_sql', name: search },
    { enabled: canShowLogsSection, placeholderData: keepPreviousData }
  )

  const databaseCount = count ? count.private + count.shared : 0
  const logsResultCount = canShowLogsSection && logsCount ? logsCount.private + logsCount.shared : 0
  const totalNumber = databaseCount + logsResultCount
  const isLoadingCounts = isLoadingCount || (canShowLogsSection && isLoadingLogsCount)
  const hasCounts = count !== undefined || (canShowLogsSection && logsCount !== undefined)

  const {
    data: logsData,
    isPending: isLoadingLogs,
    hasNextPage: hasNextLogsPage,
    fetchNextPage: fetchNextLogsPage,
    isFetchingNextPage: isFetchingNextLogsPage,
  } = useSqlSnippetsQuery(
    { projectRef, type: 'log_sql', name: searchName },
    { enabled: canShowLogsSection, placeholderData: keepPreviousData }
  )

  const databaseTree = useSnippetSearchTree(data?.pages)
  const logsTree = useSnippetSearchTree(logsData?.pages)
  const hasDatabaseResults = databaseTree.count > 0
  const hasLogsResults = logsTree.count > 0
  // Label the groups only when both are present; a single group needs no heading.
  const showGroupHeadings = hasDatabaseResults && hasLogsResults
  // The results body is loading until both source queries (when enabled) settle.
  const isSearchLoading = isLoading || (canShowLogsSection && isLoadingLogs)

  return (
    <>
      <div className="flex flex-col grow">
        {isLoadingCounts && (
          <div className="px-4 py-1 pb-2.5">
            <Loader2 className="animate-spin" size={14} />
          </div>
        )}
        {!isLoadingCounts && hasCounts && (
          <p className="px-4 pb-2 text-sm text-foreground-lighter">
            {totalNumber} result{totalNumber === 1 ? '' : 's'} found
          </p>
        )}
        {isSearchLoading && (
          <div className="px-4 flex flex-col gap-y-1">
            <ShimmeringLoader className="py-2.5" />
            <ShimmeringLoader className="py-2.5 w-5/6" />
            <ShimmeringLoader className="py-2.5 w-3/4" />
          </div>
        )}
        {!isSearchLoading && !hasDatabaseResults && !hasLogsResults && (
          <p className="px-4 text-sm text-foreground-lighter">No queries found</p>
        )}
        {!isSearchLoading && hasDatabaseResults && (
          <>
            {showGroupHeadings && <SearchGroupHeading>Database</SearchGroupHeading>}
            <SqlSnippetTree
              ariaLabel="database-snippets"
              data={databaseTree.treeState}
              lastItemIds={databaseTree.lastItemIds}
              showVisibility
              itemClassName="items-start h-[40px] [&>svg]:translate-y-0.5"
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onSelectDelete={setSelectedSnippetToDelete}
              onSelectRename={setSelectedSnippetToRename}
              onSelectDownload={setSelectedSnippetToDownload}
              onSelectShare={setSelectedSnippetToShare}
              onSelectUnshare={setSelectedSnippetToUnshare}
            />
          </>
        )}
        {!isSearchLoading && canShowLogsSection && hasLogsResults && (
          <>
            {showGroupHeadings && <SearchGroupHeading>Logs</SearchGroupHeading>}
            <SqlSnippetTree
              ariaLabel="logs-snippets"
              data={logsTree.treeState}
              lastItemIds={logsTree.lastItemIds}
              showVisibility
              itemClassName="items-start h-[40px] [&>svg]:translate-y-0.5"
              hasNextPage={hasNextLogsPage}
              fetchNextPage={fetchNextLogsPage}
              isFetchingNextPage={isFetchingNextLogsPage}
              onSelectDelete={setSelectedSnippetToDelete}
              onSelectRename={setSelectedSnippetToRename}
            />
          </>
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
        open={selectedSnippetToDownload !== undefined}
        onOpenChange={() => setSelectedSnippetToDownload(undefined)}
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
