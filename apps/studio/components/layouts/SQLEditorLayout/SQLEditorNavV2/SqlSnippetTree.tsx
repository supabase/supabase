import { useParams } from 'common'
import { TreeView } from 'ui'

import type { TreeViewItemProps } from './SQLEditorNav.utils'
import { SQLEditorTreeViewItem } from './SQLEditorTreeViewItem'
import { Snippet } from '@/data/content/sql-folders-query'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

interface SqlSnippetTreeProps {
  ariaLabel: string
  data: TreeViewItemProps[]
  lastItemIds: Set<string>
  /** Additional (multi-)selected snippet ids to highlight beyond the active one. */
  selectedSnippetIds?: string[]
  /** Search results show a Private/Shared sublabel under each snippet name. */
  showVisibility?: boolean
  itemClassName?: string
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
  onSelectDelete?: (snippet: Snippet) => void
  onSelectRename?: (snippet: Snippet) => void
  onSelectDownload?: (snippet: Snippet) => void
  onSelectShare?: (snippet: Snippet) => void
  onSelectUnshare?: (snippet: Snippet) => void
}

const visibilityLabel = (visibility: string | undefined) => {
  if (visibility === 'user') return 'Private'
  if (visibility === 'project') return 'Shared'
  return undefined
}

export const SqlSnippetTree = ({
  ariaLabel,
  data,
  lastItemIds,
  selectedSnippetIds,
  showVisibility = false,
  itemClassName,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  onSelectDelete,
  onSelectRename,
  onSelectDownload,
  onSelectShare,
  onSelectUnshare,
}: SqlSnippetTreeProps) => {
  const { id } = useParams()
  const tabs = useTabsStateSnapshot()

  return (
    <TreeView
      multiSelect
      togglableSelect
      clickAction="EXCLUSIVE_SELECT"
      data={data}
      aria-label={ariaLabel}
      nodeRenderer={({ element, ...props }) => {
        const snippet = element.metadata as Snippet
        const isOpened = Object.values(tabs.tabsMap).some(
          (tab) => tab.metadata?.sqlId === snippet.id
        )
        const tabId = createTabId('sql', { id: snippet.id })
        const isPreview = tabs.previewTabId === tabId
        const isActive = !isPreview && snippet.id === id
        const isSelected = isActive || (selectedSnippetIds?.includes(snippet.id) ?? false)
        const visibility = showVisibility ? visibilityLabel(snippet.visibility) : undefined

        return (
          <SQLEditorTreeViewItem
            {...props}
            element={
              showVisibility
                ? {
                    ...element,
                    name: (
                      <span className="flex flex-col py-0.5">
                        <span className="truncate">{element.name}</span>
                        {!!visibility && (
                          <span className="text-foreground-lighter text-xs">{visibility}</span>
                        )}
                      </span>
                    ),
                  }
                : element
            }
            nameForTitle={showVisibility ? (element.name as string) : undefined}
            isBranch={false}
            isOpened={isOpened && !isPreview}
            isSelected={isSelected}
            isPreview={isPreview}
            isLastItem={lastItemIds.has(element.id as string)}
            status="idle"
            className={itemClassName}
            onSelectDelete={onSelectDelete ? () => onSelectDelete(snippet) : undefined}
            onSelectRename={onSelectRename ? () => onSelectRename(snippet) : undefined}
            onSelectDownload={onSelectDownload ? () => onSelectDownload(snippet) : undefined}
            onSelectShare={onSelectShare ? () => onSelectShare(snippet) : undefined}
            onSelectUnshare={onSelectUnshare ? () => onSelectUnshare(snippet) : undefined}
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
  )
}
