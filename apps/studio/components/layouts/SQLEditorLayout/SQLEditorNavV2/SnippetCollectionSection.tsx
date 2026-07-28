import { useParams } from 'common'
import { ComponentProps, ReactNode } from 'react'
import { TreeView } from 'ui'
import {
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
} from 'ui-patterns/InnerSideMenu'

import { SQLEditorLoadingSnippets } from './SQLEditorLoadingSnippets'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'
import { Snippet } from '@/data/content/sql-folders-query'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

type TreeViewData = ComponentProps<typeof TreeView>['data']
type PaginationProps = Pick<
  ComponentProps<typeof SQLEditorTreeViewItem>,
  'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>

interface SnippetCollectionSectionProps extends PaginationProps {
  title: string
  count: number
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading: boolean
  snippets: Snippet[]
  treeData: TreeViewData
  ariaLabel: string
  emptyState: ReactNode
  selectedSnippets: Snippet[]
  lastItemIds: Set<string>
  onSelectDelete: (snippet: Snippet) => void
  onSelectRename: (snippet: Snippet) => void
  onSelectDownload: (snippet: Snippet) => void
  onSelectShare?: (snippet: Snippet) => void
  onSelectUnshare?: (snippet: Snippet) => void
}

export const SnippetCollectionSection = ({
  title,
  count,
  open,
  onOpenChange,
  isLoading,
  snippets,
  treeData,
  ariaLabel,
  emptyState,
  selectedSnippets,
  lastItemIds,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  onSelectDelete,
  onSelectRename,
  onSelectDownload,
  onSelectShare,
  onSelectUnshare,
}: SnippetCollectionSectionProps) => {
  const { id } = useParams()
  const tabs = useTabsStateSnapshot()

  return (
    <InnerSideMenuCollapsible className="px-0" open={open} onOpenChange={onOpenChange}>
      <InnerSideMenuCollapsibleTrigger title={`${title}${count > 0 ? ` (${count})` : ''}`} />
      <InnerSideMenuCollapsibleContent className="group-data-open:pt-2">
        {isLoading && <SQLEditorLoadingSnippets />}
        {!isLoading && snippets.length === 0 && emptyState}
        {!isLoading && snippets.length > 0 && (
          <TreeView
            data={treeData}
            aria-label={ariaLabel}
            nodeRenderer={({ element, ...props }) => {
              const snippet = element.metadata as Snippet
              const tabId = createTabId('sql', { id: snippet.id })
              const isPreview = tabs.previewTabId === tabId
              const isActive = !isPreview && snippet.id === id
              const isOpened = Object.values(tabs.tabsMap).some(
                (tab) => tab.metadata?.sqlId === snippet.id
              )
              const isSelected = selectedSnippets.some(({ id }) => id === snippet.id)

              return (
                <SQLEditorTreeViewItem
                  {...props}
                  element={element}
                  isSelected={isActive || isSelected}
                  isOpened={isOpened && !isPreview}
                  isPreview={isPreview}
                  onDoubleClick={(event) => {
                    event.preventDefault()
                    tabs.makeTabPermanent(tabId)
                  }}
                  onSelectDelete={() => onSelectDelete(snippet)}
                  onSelectRename={() => onSelectRename(snippet)}
                  onSelectDownload={() => onSelectDownload(snippet)}
                  onSelectShare={onSelectShare ? () => onSelectShare(snippet) : undefined}
                  onSelectUnshare={onSelectUnshare ? () => onSelectUnshare(snippet) : undefined}
                  isLastItem={lastItemIds.has(element.id as string)}
                  hasNextPage={hasNextPage}
                  fetchNextPage={fetchNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                />
              )
            }}
          />
        )}
      </InnerSideMenuCollapsibleContent>
    </InnerSideMenuCollapsible>
  )
}
