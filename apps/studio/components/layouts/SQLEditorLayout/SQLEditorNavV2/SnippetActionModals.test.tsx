import { fireEvent, render, screen } from '@testing-library/react'
import { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SnippetActionModals } from './SnippetActionModals'
import { Snippet, SnippetFolder } from '@/data/content/sql-folders-query'

vi.mock('@/components/interfaces/SQLEditor/RenameQueryModal', () => ({
  RenameQueryModal: ({
    snippet,
    visible,
    onCancel,
    onComplete,
  }: {
    snippet?: Snippet
    visible: boolean
    onCancel: () => void
    onComplete: () => void
  }) => (
    <div data-testid="rename-modal" data-visible={visible} data-snippet-id={snippet?.id}>
      <button tabIndex={0} onClick={onCancel}>
        Close rename
      </button>
      <button tabIndex={0} onClick={onComplete}>
        Complete rename
      </button>
    </div>
  ),
}))

vi.mock('@/components/interfaces/SQLEditor/MoveQueryModal', () => ({
  MoveQueryModal: ({
    snippets,
    visible,
    onClose,
  }: {
    snippets: Snippet[]
    visible: boolean
    onClose: () => void
  }) => (
    <div data-testid="move-modal" data-visible={visible} data-snippet-count={snippets.length}>
      <button tabIndex={0} onClick={onClose}>
        Close move
      </button>
    </div>
  ),
}))

vi.mock('@/components/interfaces/SQLEditor/DownloadSnippetModal', () => ({
  DownloadSnippetModal: ({
    id,
    open,
    onOpenChange,
  }: {
    id: string
    open: boolean
    onOpenChange: () => void
  }) => (
    <div data-testid="download-modal" data-open={open} data-snippet-id={id}>
      <button tabIndex={0} onClick={onOpenChange}>
        Close download
      </button>
    </div>
  ),
}))

vi.mock('./ShareSnippetModal', () => ({
  ShareSnippetModal: ({
    snippet,
    onClose,
    onSuccess,
  }: {
    snippet?: Snippet
    onClose: () => void
    onSuccess: () => void
  }) => (
    <div data-testid="share-modal" data-snippet-id={snippet?.id}>
      <button tabIndex={0} onClick={onClose}>
        Close share
      </button>
      <button tabIndex={0} onClick={onSuccess}>
        Complete share
      </button>
    </div>
  ),
}))

vi.mock('./UnshareSnippetModal', () => ({
  UnshareSnippetModal: ({
    snippet,
    onClose,
    onSuccess,
  }: {
    snippet?: Snippet
    onClose: () => void
    onSuccess: () => void
  }) => (
    <div data-testid="unshare-modal" data-snippet-id={snippet?.id}>
      <button tabIndex={0} onClick={onClose}>
        Close unshare
      </button>
      <button tabIndex={0} onClick={onSuccess}>
        Complete unshare
      </button>
    </div>
  ),
}))

vi.mock('./DeleteSnippetsModal', () => ({
  DeleteSnippetsModal: ({
    visible,
    snippets,
    onClose,
  }: {
    visible: boolean
    snippets: Snippet[]
    onClose: () => void
  }) => (
    <div data-testid="delete-modal" data-visible={visible} data-snippet-count={snippets.length}>
      <button tabIndex={0} onClick={onClose}>
        Close delete
      </button>
    </div>
  ),
}))

vi.mock('ui-patterns/Dialogs/ConfirmationModal', () => ({
  default: ({
    visible,
    loading,
    onCancel,
    onConfirm,
    children,
  }: {
    visible: boolean
    loading: boolean
    onCancel: () => void
    onConfirm: () => void
    children: ReactNode
  }) => (
    <div data-testid="folder-delete-modal" data-visible={visible} data-loading={loading}>
      {children}
      <button tabIndex={0} onClick={onCancel}>
        Cancel folder delete
      </button>
      <button tabIndex={0} onClick={onConfirm}>
        Confirm folder delete
      </button>
    </div>
  ),
}))

const snippet = { id: 'snippet-1', name: 'Test query' } as Snippet
const folder = { id: 'folder-1', name: 'Test folder' } as SnippetFolder

const callbacks = {
  onRenameClose: vi.fn(),
  onMoveClose: vi.fn(),
  onDownloadClose: vi.fn(),
  onShareClose: vi.fn(),
  onShareSuccess: vi.fn(),
  onUnshareClose: vi.fn(),
  onUnshareSuccess: vi.fn(),
  onDeleteClose: vi.fn(),
  onFolderDeleteCancel: vi.fn(),
  onFolderDeleteConfirm: vi.fn(),
}

const defaultProps = {
  selectedSnippets: [snippet],
  selectedSnippetToRename: snippet,
  selectedSnippetToDownload: snippet,
  selectedSnippetToShare: snippet,
  selectedSnippetToUnshare: snippet,
  selectedFolderToDelete: folder,
  showRenameModal: true,
  showMoveModal: true,
  showDeleteModal: true,
  isDeletingFolder: true,
  ...callbacks,
}

describe('SnippetActionModals', () => {
  it('wires modal visibility, loading, and selected entities', () => {
    render(<SnippetActionModals {...defaultProps} />)

    expect(screen.getByTestId('rename-modal')).toHaveAttribute('data-visible', 'true')
    expect(screen.getByTestId('rename-modal')).toHaveAttribute('data-snippet-id', snippet.id)
    expect(screen.getByTestId('move-modal')).toHaveAttribute('data-snippet-count', '1')
    expect(screen.getByTestId('download-modal')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('share-modal')).toHaveAttribute('data-snippet-id', snippet.id)
    expect(screen.getByTestId('unshare-modal')).toHaveAttribute('data-snippet-id', snippet.id)
    expect(screen.getByTestId('delete-modal')).toHaveAttribute('data-visible', 'true')
    expect(screen.getByTestId('folder-delete-modal')).toHaveAttribute('data-visible', 'true')
    expect(screen.getByTestId('folder-delete-modal')).toHaveAttribute('data-loading', 'true')
    expect(screen.getByText(/Test folder/)).toBeInTheDocument()
  })

  it('hides folder deletion when no folder is selected', () => {
    render(
      <SnippetActionModals
        {...defaultProps}
        selectedFolderToDelete={undefined}
        isDeletingFolder={false}
      />
    )

    expect(screen.getByTestId('folder-delete-modal')).toHaveAttribute('data-visible', 'false')
    expect(screen.getByTestId('folder-delete-modal')).toHaveAttribute('data-loading', 'false')
  })

  it('forwards every modal callback', () => {
    render(<SnippetActionModals {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close rename' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete rename' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close move' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close download' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close share' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete share' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close unshare' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete unshare' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel folder delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm folder delete' }))

    expect(callbacks.onRenameClose).toHaveBeenCalledTimes(2)
    expect(callbacks.onMoveClose).toHaveBeenCalledOnce()
    expect(callbacks.onDownloadClose).toHaveBeenCalledOnce()
    expect(callbacks.onShareClose).toHaveBeenCalledOnce()
    expect(callbacks.onShareSuccess).toHaveBeenCalledOnce()
    expect(callbacks.onUnshareClose).toHaveBeenCalledOnce()
    expect(callbacks.onUnshareSuccess).toHaveBeenCalledOnce()
    expect(callbacks.onDeleteClose).toHaveBeenCalledOnce()
    expect(callbacks.onFolderDeleteCancel).toHaveBeenCalledOnce()
    expect(callbacks.onFolderDeleteConfirm).toHaveBeenCalledOnce()
  })
})
