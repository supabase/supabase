import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { useEffect, useMemo } from 'react'
import {
  InnerSideBarEmptyPanel,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
} from 'ui-patterns/InnerSideMenu'

import { SQLEditorLoadingSnippets } from './SQLEditorLoadingSnippets'
import {
  formatFolderResponseForTreeView,
  getLastItemIds,
  ROOT_NODE,
  withActiveSnippet,
} from './SQLEditorNav.utils'
import { SqlSnippetTree } from './SqlSnippetTree'
import { getSnippetSource } from '@/components/interfaces/SQLEditor/querySource'
import { useContentCountQuery } from '@/data/content/content-count-query'
import { Snippet } from '@/data/content/sql-folders-query'
import { useSqlSnippetsQuery } from '@/data/content/sql-snippets-query'
import { useLatest } from '@/hooks/misc/useLatest'

interface LogsSnippetsSectionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sort: 'inserted_at' | 'name'
  /** The currently open snippet, surfaced in the list before the query fetches it. */
  activeSnippet?: Snippet
  selectedSnippetIds: string[]
  /** Bubbles loaded logs snippets up for tab cleanup, mirroring onFolderContentsChange. */
  onSnippetsLoaded: (info: {
    snippets: Snippet[]
    /**
     * Whether `snippets` is the complete set of logs snippets. Only true once every
     * page has been fetched — cleanup prunes tabs whose snippet is absent from the
     * list, and a snippet on an unfetched page would otherwise look deleted.
     */
    isComplete: boolean
    isSettled: boolean
  }) => void
  onSelectDelete: (snippet: Snippet) => void
  onSelectRename: (snippet: Snippet) => void
}

/**
 * A separate single-type `log_sql` query — logs snippets are a distinct backend and
 * don't participate in folders, so they get their own flat section rather than merging
 * with the cursor-paginated `sql` sections.
 */
export const LogsSnippetsSection = ({
  open,
  onOpenChange,
  sort,
  activeSnippet,
  selectedSnippetIds,
  onSnippetsLoaded,
  onSelectDelete,
  onSelectRename,
}: LogsSnippetsSectionProps) => {
  const { ref: projectRef } = useParams()

  const { data, isLoading, isSuccess, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSqlSnippetsQuery(
      { projectRef, type: 'log_sql', sort },
      { placeholderData: keepPreviousData }
    )

  const { data: countData } = useContentCountQuery({ projectRef, type: 'log_sql' })
  const numSnippets = (countData?.private ?? 0) + (countData?.shared ?? 0)

  const snippets = useMemo(() => {
    const pageSnippets = data?.pages.flatMap((page) => page.contents ?? []) ?? []

    return withActiveSnippet<Snippet>(
      pageSnippets,
      activeSnippet,
      (s) => getSnippetSource(s) === 'logs'
    )
      .map((x) => ({ ...x, folder_id: null }))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        return new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
      })
  }, [data?.pages, activeSnippet, sort])

  const treeState = useMemo(
    () =>
      snippets.length === 0
        ? [ROOT_NODE]
        : formatFolderResponseForTreeView({ contents: snippets, folders: [] }),
    [snippets]
  )
  const lastItemIds = useMemo(() => getLastItemIds(treeState), [treeState])

  const onSnippetsLoadedRef = useLatest(onSnippetsLoaded)
  useEffect(() => {
    onSnippetsLoadedRef.current({
      snippets,
      isComplete: isSuccess && !hasNextPage,
      isSettled: isSuccess || isError,
    })
  }, [snippets, isSuccess, isError, hasNextPage])

  return (
    <InnerSideMenuCollapsible className="px-0" open={open} onOpenChange={onOpenChange}>
      <InnerSideMenuCollapsibleTrigger
        title={`Logs ${numSnippets > 0 ? ` (${numSnippets})` : ''}`}
      />
      <InnerSideMenuCollapsibleContent className="group-data-open:pt-2">
        {isLoading && <SQLEditorLoadingSnippets />}
        {!isLoading && snippets.length === 0 && (
          <InnerSideBarEmptyPanel
            className="mx-2"
            title="No logs queries"
            description="Create a logs query from the toolbar to explore your project's logs with SQL."
          />
        )}
        {!isLoading && snippets.length > 0 && (
          <SqlSnippetTree
            ariaLabel="logs-snippets"
            data={treeState}
            lastItemIds={lastItemIds}
            selectedSnippetIds={selectedSnippetIds}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onSelectDelete={onSelectDelete}
            onSelectRename={onSelectRename}
          />
        )}
      </InnerSideMenuCollapsibleContent>
    </InnerSideMenuCollapsible>
  )
}
