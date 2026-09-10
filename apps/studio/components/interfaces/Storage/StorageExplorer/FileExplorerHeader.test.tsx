import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_SORT_BY, STORAGE_SORT_BY_ORDER, STORAGE_VIEWS } from '../Storage.constants'
import { FileExplorerHeader } from './FileExplorerHeader'
import { customRender as render } from '@/tests/lib/custom-render'

const {
  mockTrack,
  mockUseStorageExplorerStateSnapshot,
  mockUseAsyncCheckPermissions,
  mockUseStoragePreference,
} = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockUseStorageExplorerStateSnapshot: vi.fn(),
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseStoragePreference: vi.fn(),
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))
vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => mockUseStorageExplorerStateSnapshot(),
}))
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => mockUseAsyncCheckPermissions(),
}))

vi.mock('./useStoragePreference', () => ({
  useStoragePreference: (...args: any[]) => mockUseStoragePreference(...args),
}))

function makeColumn(name: string) {
  return {
    id: name,
    name,
    status: 'READY',
    items: [],
  }
}

function createSnapshot() {
  return {
    projectRef: 'test-ref',
    columns: [makeColumn('my-bucket'), makeColumn('images'), makeColumn('2024')],
    popColumn: vi.fn(),
    popColumnAtIndex: vi.fn(),
    popOpenedFolders: vi.fn(),
    popOpenedFoldersAtIndex: vi.fn(),
    fetchFoldersByPath: vi.fn().mockResolvedValue(undefined),
    refetchAllOpenedFolders: vi.fn().mockResolvedValue(undefined),
    addNewFolderPlaceholder: vi.fn(),
    clearOpenedFolders: vi.fn(),
    setSelectedFilePreview: vi.fn(),
    selectedBucket: { id: 'bucket-id', name: 'my-bucket' },
    isSearching: false,
    setIsSearching: vi.fn(),
  }
}

function createPreference(view: STORAGE_VIEWS = STORAGE_VIEWS.COLUMNS) {
  return {
    view,
    setView: vi.fn(),
    sortBy: STORAGE_SORT_BY.NAME,
    setSortBy: vi.fn(),
    sortByOrder: STORAGE_SORT_BY_ORDER.ASC,
    setSortByOrder: vi.fn(),
    sortBucket: 'created_at',
    setSortBucket: vi.fn(),
  }
}

describe('FileExplorerHeader', () => {
  beforeEach(() => {
    mockTrack.mockReset()
    mockUseStorageExplorerStateSnapshot.mockReset()
    mockUseAsyncCheckPermissions.mockReset()
    mockUseStoragePreference.mockReset()

    mockUseStorageExplorerStateSnapshot.mockReturnValue(createSnapshot())
    mockUseStoragePreference.mockReturnValue(createPreference())
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true })
  })

  it('does not render folder breadcrumbs in column view and places Navigate before Reload', () => {
    render(
      <FileExplorerHeader
        itemSearchString=""
        setItemSearchString={vi.fn()}
        onFilesUpload={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: 'my-bucket' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'images' })).not.toBeInTheDocument()
    expect(screen.queryByText('2024')).not.toBeInTheDocument()

    const navigateButton = screen.getByRole('button', { name: 'Navigate' })
    const reloadButton = screen.getByRole('button', { name: 'Reload' })

    expect(
      navigateButton.compareDocumentPosition(reloadButton) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('renders a go-up button to the left of search when not at bucket root', () => {
    mockUseStoragePreference.mockReturnValue(createPreference(STORAGE_VIEWS.LIST))

    render(
      <FileExplorerHeader
        itemSearchString=""
        setItemSearchString={vi.fn()}
        onFilesUpload={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Go up one level' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'my-bucket' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'images' })).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search in 2024...')).toBeInTheDocument()
  })

  it('does not render the go-up button in column view when not at bucket root', () => {
    render(
      <FileExplorerHeader
        itemSearchString=""
        setItemSearchString={vi.fn()}
        onFilesUpload={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: 'Go up one level' })).not.toBeInTheDocument()
  })

  it('does not render the go-up button at bucket root', () => {
    const snapshot = createSnapshot()
    snapshot.columns = [makeColumn('my-bucket')]
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)
    mockUseStoragePreference.mockReturnValue(createPreference(STORAGE_VIEWS.LIST))

    render(
      <FileExplorerHeader
        itemSearchString=""
        setItemSearchString={vi.fn()}
        onFilesUpload={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: 'Go up one level' })).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search in root directory...')).toBeInTheDocument()
  })

  it('goes up one folder level when the go-up button is clicked', async () => {
    const snapshot = createSnapshot()
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)
    mockUseStoragePreference.mockReturnValue(createPreference(STORAGE_VIEWS.LIST))

    render(
      <FileExplorerHeader
        itemSearchString=""
        setItemSearchString={vi.fn()}
        onFilesUpload={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Go up one level' }))

    expect(snapshot.popColumn).toHaveBeenCalled()
    expect(snapshot.popOpenedFolders).toHaveBeenCalled()
    expect(snapshot.setSelectedFilePreview).toHaveBeenCalledWith(undefined)
  })

  it('opens path edit mode from Navigate and tracks the click', async () => {
    render(
      <FileExplorerHeader
        itemSearchString=""
        setItemSearchString={vi.fn()}
        onFilesUpload={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Navigate' }))

    expect(mockTrack).toHaveBeenCalledWith('storage_explorer_navigate_clicked')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Navigate to folder')).toBeInTheDocument()
    expect(screen.getByDisplayValue('images/2024')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Navigate' })).toBeInTheDocument()
  })

  it('submits a path, tracks the submission, and calls the existing path navigation flow', async () => {
    const snapshot = createSnapshot()
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    render(
      <FileExplorerHeader
        itemSearchString=""
        setItemSearchString={vi.fn()}
        onFilesUpload={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Navigate' }))

    const input = screen.getByDisplayValue('images/2024')
    await userEvent.clear(input)
    await userEvent.type(input, 'archive/2025')
    await userEvent.click(screen.getByRole('button', { name: 'Navigate' }))

    await waitFor(() => {
      expect(snapshot.fetchFoldersByPath).toHaveBeenCalledWith({ paths: ['archive', '2025'] })
    })
    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('storage_explorer_navigate_submitted')
    })

    expect(mockTrack).toHaveBeenCalledWith('storage_explorer_navigate_clicked')
  })

  it('navigates to bucket root without tracking a folder-path submission', async () => {
    const snapshot = createSnapshot()
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)

    render(
      <FileExplorerHeader
        itemSearchString=""
        setItemSearchString={vi.fn()}
        onFilesUpload={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Navigate' }))

    const input = screen.getByDisplayValue('images/2024')
    await userEvent.clear(input)
    await userEvent.click(screen.getByRole('button', { name: 'Navigate' }))

    await waitFor(() => {
      expect(snapshot.popColumnAtIndex).toHaveBeenCalledWith(0)
    })

    expect(snapshot.clearOpenedFolders).toHaveBeenCalled()
    expect(snapshot.setSelectedFilePreview).toHaveBeenCalledWith(undefined)
    expect(mockTrack).toHaveBeenCalledWith('storage_explorer_navigate_clicked')
    expect(mockTrack).not.toHaveBeenCalledWith('storage_explorer_navigate_submitted')
  })

  it('does not render Navigate in list view', () => {
    mockUseStoragePreference.mockReturnValue(createPreference(STORAGE_VIEWS.LIST))

    render(
      <FileExplorerHeader
        itemSearchString=""
        setItemSearchString={vi.fn()}
        onFilesUpload={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: 'Navigate' })).not.toBeInTheDocument()
  })
})
