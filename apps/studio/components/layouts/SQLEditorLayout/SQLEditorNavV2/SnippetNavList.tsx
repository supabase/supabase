import { ReactNode } from 'react'

import { SnippetNavItem } from './SnippetNavItem'
import { SnippetNavLoadMore } from './SnippetNavLoadMore'
import { Snippet } from '@/data/content/sql-folders-query'

export interface SnippetNavListProps {
  snippets: Snippet[]
  depth?: number
  selectedSnippets?: Snippet[]
  isMultiSelected?: boolean
  onMultiSelect?: (id: string) => void
  activeSnippetId?: string
  isPreviewTabId?: (snippetId: string) => boolean
  getLabel?: (snippet: Snippet) => ReactNode
  getTitle?: (snippet: Snippet) => string | undefined
  getItemClassName?: (snippet: Snippet) => string | undefined
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
  onSnippetDelete?: (snippet: Snippet) => void
  onSnippetRename?: (snippet: Snippet) => void
  onSnippetMove?: (snippet: Snippet) => void
  onSnippetShare?: (snippet: Snippet) => void
  onSnippetUnshare?: (snippet: Snippet) => void
  onSnippetDownload?: (snippet: Snippet) => void
}

export function SnippetNavList({
  snippets,
  depth = 1,
  selectedSnippets = [],
  isMultiSelected = false,
  onMultiSelect,
  activeSnippetId,
  isPreviewTabId,
  getLabel,
  getTitle,
  getItemClassName,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  onSnippetDelete,
  onSnippetRename,
  onSnippetMove,
  onSnippetShare,
  onSnippetUnshare,
  onSnippetDownload,
}: SnippetNavListProps) {
  if (snippets.length === 0 && !hasNextPage) return null

  return (
    <>
      {snippets.map((snippet) => {
        const isActive = activeSnippetId === snippet.id
        const isPreview = isPreviewTabId?.(snippet.id) ?? false
        const isHighlighted =
          isActive || selectedSnippets.some((selected) => selected.id === snippet.id)

        return (
          <SnippetNavItem
            key={snippet.id}
            snippet={snippet}
            depth={depth}
            isActive={isActive && !isPreview}
            isHighlighted={isHighlighted && !isPreview}
            isPreview={isPreview}
            isMultiSelected={isMultiSelected}
            onMultiSelect={onMultiSelect}
            label={getLabel?.(snippet)}
            title={getTitle?.(snippet)}
            className={getItemClassName?.(snippet)}
            onSelectDelete={onSnippetDelete ? () => onSnippetDelete(snippet) : undefined}
            onSelectRename={onSnippetRename ? () => onSnippetRename(snippet) : undefined}
            onSelectMove={onSnippetMove ? () => onSnippetMove(snippet) : undefined}
            onSelectShare={onSnippetShare ? () => onSnippetShare(snippet) : undefined}
            onSelectUnshare={onSnippetUnshare ? () => onSnippetUnshare(snippet) : undefined}
            onSelectDownload={onSnippetDownload ? () => onSnippetDownload(snippet) : undefined}
          />
        )
      })}
      <SnippetNavLoadMore
        depth={depth}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  )
}
