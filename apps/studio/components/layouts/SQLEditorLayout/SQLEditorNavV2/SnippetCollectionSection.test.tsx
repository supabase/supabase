import { fireEvent, render, screen } from '@testing-library/react'
import { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SnippetCollectionSection } from './SnippetCollectionSection'
import { Snippet } from '@/data/content/sql-folders-query'

const { mockTabsState } = vi.hoisted(() => ({
  mockTabsState: {
    previewTabId: undefined as string | undefined,
    tabsMap: {} as Record<string, { metadata?: { sqlId?: string } }>,
    makeTabPermanent: vi.fn(),
  },
}))

vi.mock('common', () => ({
  useParams: () => ({ id: 'snippet-1' }),
}))

vi.mock('@/state/tabs', () => ({
  createTabId: (_type: string, { id }: { id: string }) => `sql-${id}`,
  useTabsStateSnapshot: () => mockTabsState,
}))

vi.mock('ui', () => ({
  TreeView: ({
    data,
    nodeRenderer,
  }: {
    data: Array<{ id: string; metadata: Snippet }>
    nodeRenderer: (props: {
      element: { id: string; metadata: Snippet }
      isBranch: boolean
    }) => ReactNode
  }) => <div data-testid="tree">{nodeRenderer({ element: data[0], isBranch: false })}</div>,
}))

vi.mock('ui-patterns/InnerSideMenu', () => ({
  InnerSideMenuCollapsible: ({ children }: { children: ReactNode }) => (
    <section>{children}</section>
  ),
  InnerSideMenuCollapsibleContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  InnerSideMenuCollapsibleTrigger: ({ title }: { title: string }) => <h2>{title}</h2>,
}))

vi.mock('./SQLEditorLoadingSnippets', () => ({
  SQLEditorLoadingSnippets: () => <div>Loading snippets</div>,
}))

vi.mock('./SQLEditorTreeViewItem', () => ({
  SQLEditorTreeViewItem: ({
    isSelected,
    isOpened,
    isPreview,
    onDoubleClick,
    onSelectDelete,
    onSelectRename,
    onSelectDownload,
    onSelectShare,
    onSelectUnshare,
  }: {
    isSelected: boolean
    isOpened: boolean
    isPreview: boolean
    onDoubleClick: (event: React.MouseEvent) => void
    onSelectDelete: () => void
    onSelectRename: () => void
    onSelectDownload: () => void
    onSelectShare?: () => void
    onSelectUnshare?: () => void
  }) => (
    <div
      data-testid="tree-item"
      data-selected={isSelected}
      data-opened={isOpened}
      data-preview={isPreview}
      onDoubleClick={onDoubleClick}
    >
      <button tabIndex={0} onClick={onSelectDelete}>
        Delete
      </button>
      <button tabIndex={0} onClick={onSelectRename}>
        Rename
      </button>
      <button tabIndex={0} onClick={onSelectDownload}>
        Download
      </button>
      {onSelectShare && (
        <button tabIndex={0} onClick={onSelectShare}>
          Share
        </button>
      )}
      {onSelectUnshare && (
        <button tabIndex={0} onClick={onSelectUnshare}>
          Unshare
        </button>
      )}
    </div>
  ),
}))

const snippet = {
  id: 'snippet-1',
  name: 'Test query',
  visibility: 'user',
} as Snippet

const defaultProps = {
  title: 'Favorites',
  count: 1,
  open: true,
  onOpenChange: vi.fn(),
  isLoading: false,
  snippets: [snippet],
  treeData: [
    {
      id: snippet.id,
      name: snippet.name,
      parent: null,
      children: [],
      metadata: snippet,
    },
  ],
  ariaLabel: 'favorite-snippets',
  emptyState: <div>No snippets</div>,
  selectedSnippets: [],
  lastItemIds: new Set([snippet.id]),
  hasNextPage: false,
  fetchNextPage: vi.fn(),
  isFetchingNextPage: false,
  onSelectDelete: vi.fn(),
  onSelectRename: vi.fn(),
  onSelectDownload: vi.fn(),
  onSelectShare: vi.fn(),
  onSelectUnshare: vi.fn(),
}

describe('SnippetCollectionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTabsState.previewTabId = undefined
    mockTabsState.tabsMap = {}
  })

  it('renders its loading and empty states', () => {
    const { rerender } = render(<SnippetCollectionSection {...defaultProps} isLoading />)

    expect(screen.getByText('Loading snippets')).toBeInTheDocument()

    rerender(<SnippetCollectionSection {...defaultProps} snippets={[]} />)

    expect(screen.getByText('No snippets')).toBeInTheDocument()
  })

  it('derives active and opened state for a snippet', () => {
    mockTabsState.tabsMap = { first: { metadata: { sqlId: snippet.id } } }

    render(<SnippetCollectionSection {...defaultProps} />)

    expect(screen.getByRole('heading', { name: 'Favorites (1)' })).toBeInTheDocument()
    expect(screen.getByTestId('tree-item')).toHaveAttribute('data-selected', 'true')
    expect(screen.getByTestId('tree-item')).toHaveAttribute('data-opened', 'true')
    expect(screen.getByTestId('tree-item')).toHaveAttribute('data-preview', 'false')
  })

  it('marks preview tabs separately and makes them permanent on double-click', () => {
    mockTabsState.previewTabId = `sql-${snippet.id}`

    render(<SnippetCollectionSection {...defaultProps} />)
    fireEvent.doubleClick(screen.getByTestId('tree-item'))

    expect(screen.getByTestId('tree-item')).toHaveAttribute('data-selected', 'false')
    expect(screen.getByTestId('tree-item')).toHaveAttribute('data-preview', 'true')
    expect(mockTabsState.makeTabPermanent).toHaveBeenCalledWith(`sql-${snippet.id}`)
  })

  it('forwards snippet actions to the parent', () => {
    render(<SnippetCollectionSection {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }))
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    fireEvent.click(screen.getByRole('button', { name: 'Unshare' }))

    expect(defaultProps.onSelectDelete).toHaveBeenCalledWith(snippet)
    expect(defaultProps.onSelectRename).toHaveBeenCalledWith(snippet)
    expect(defaultProps.onSelectDownload).toHaveBeenCalledWith(snippet)
    expect(defaultProps.onSelectShare).toHaveBeenCalledWith(snippet)
    expect(defaultProps.onSelectUnshare).toHaveBeenCalledWith(snippet)
  })
})
