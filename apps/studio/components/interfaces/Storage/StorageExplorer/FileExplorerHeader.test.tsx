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
  mockGoUpOneLevel,
  mockNavigateToPath,
} = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockUseStorageExplorerStateSnapshot: vi.fn(),
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseStoragePreference: vi.fn(),
  mockGoUpOneLevel: vi.fn(),
  mockNavigateToPath: vi.fn(),
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))
vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => mockUseStorageExplorerStateSnapshot(),
}))
vi.mock('@/hooks/misc/useCheckPermissionsV2', () => ({
  useAsyncCheckPermissionsV2: () => mockUseAsyncCheckPermissions(),
  FGA_PERMISSIONS: {
    PROJECT: {
      STORAGE_WRITE: 'storage_write',
    },
  },
}))

vi.mock('./StorageExplorerNavigation', () => ({
  useStorageExplorerNavigation: () => ({
    goUpOneLevel: mockGoUpOneLevel,
    navigateToPath: mockNavigateToPath,
  }),
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

const renderHeader = () =>
  render(
    <FileExplorerHeader itemSearchString="" setItemSearchString={vi.fn()} onFilesUpload={vi.fn()} />
  )

describe('FileExplorerHeader', () => {
  beforeEach(() => {
    mockTrack.mockReset()
    mockUseStorageExplorerStateSnapshot.mockReset()
    mockUseAsyncCheckPermissions.mockReset()
    mockUseStoragePreference.mockReset()
    mockGoUpOneLevel.mockReset()
    mockNavigateToPath.mockReset()

    mockUseStorageExplorerStateSnapshot.mockReturnValue(createSnapshot())
    mockUseStoragePreference.mockReturnValue(createPreference())
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true })
  })

  it('in column view, shows Navigate before Reload with no breadcrumbs or go-up button', () => {
    renderHeader()

    expect(screen.queryByRole('button', { name: 'my-bucket' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'images' })).not.toBeInTheDocument()
    expect(screen.queryByText('2024')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go up one level' })).not.toBeInTheDocument()

    const navigateButton = screen.getByRole('button', { name: 'Navigate' })
    const reloadButton = screen.getByRole('button', { name: 'Reload' })

    expect(
      navigateButton.compareDocumentPosition(reloadButton) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('in list view below the bucket root, replaces Navigate with a go-up button that goes up a level', async () => {
    mockUseStoragePreference.mockReturnValue(createPreference(STORAGE_VIEWS.LIST))

    renderHeader()

    expect(screen.queryByRole('button', { name: 'Navigate' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'my-bucket' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'images' })).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search in 2024...')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Go up one level' }))

    expect(mockGoUpOneLevel).toHaveBeenCalled()
  })

  it('does not render the go-up button at bucket root', () => {
    const snapshot = createSnapshot()
    snapshot.columns = [makeColumn('my-bucket')]
    mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)
    mockUseStoragePreference.mockReturnValue(createPreference(STORAGE_VIEWS.LIST))

    renderHeader()

    expect(screen.queryByRole('button', { name: 'Go up one level' })).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search in root directory...')).toBeInTheDocument()
  })

  it('opens path edit mode prefilled with the current path, then navigates to a submitted path', async () => {
    renderHeader()

    await userEvent.click(screen.getByRole('button', { name: 'Navigate' }))

    expect(mockTrack).toHaveBeenCalledWith('storage_explorer_navigate_clicked')
    expect(screen.getByText('Navigate to folder')).toBeInTheDocument()

    const input = screen.getByDisplayValue('images/2024')
    await userEvent.clear(input)
    await userEvent.type(input, 'archive/2025')
    await userEvent.click(screen.getByRole('button', { name: 'Navigate' }))

    await waitFor(() => {
      expect(mockNavigateToPath).toHaveBeenCalledWith(['archive', '2025'])
    })
    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('storage_explorer_navigate_submitted')
    })
  })

  it('navigates to bucket root without tracking a folder-path submission', async () => {
    renderHeader()

    await userEvent.click(screen.getByRole('button', { name: 'Navigate' }))

    await userEvent.clear(screen.getByDisplayValue('images/2024'))
    await userEvent.click(screen.getByRole('button', { name: 'Navigate' }))

    await waitFor(() => {
      expect(mockNavigateToPath).toHaveBeenCalledWith([])
    })
    expect(mockTrack).not.toHaveBeenCalledWith('storage_explorer_navigate_submitted')
  })
})
