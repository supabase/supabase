import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageColumn, StorageItem, StorageItemWithColumn } from '../Storage.types'
import { FileExplorerColumn } from './FileExplorerColumn'
import { FileExplorerKeyboardNavigationProvider } from './FileExplorerKeyboardNavigation'
import { customRender as render } from '@/tests/lib/custom-render'

const {
  mockUseStorageExplorerStateSnapshot,
  mockUseStoragePreference,
  mockOpenFolderAtIndex,
  mockSetPreviewedFile,
} = vi.hoisted(() => ({
  mockUseStorageExplorerStateSnapshot: vi.fn(),
  mockUseStoragePreference: vi.fn(),
  mockOpenFolderAtIndex: vi.fn(),
  mockSetPreviewedFile: vi.fn(),
}))

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => mockUseStorageExplorerStateSnapshot(),
  // The provider reads the store directly for what a render may not have caught up with.
  // The real store is a stable proxy, so reads through it see the current state — these
  // getters stand in for that, rather than freezing the snapshot of one render.
  useStorageExplorerState: () => ({
    get columns() {
      return mockUseStorageExplorerStateSnapshot().columns
    },
    get openedFolders() {
      return mockUseStorageExplorerStateSnapshot().openedFolders
    },
  }),
}))
vi.mock('./useStoragePreference', () => ({
  useStoragePreference: () => mockUseStoragePreference(),
}))
vi.mock('./StorageExplorerNavigation', () => ({
  useStorageExplorerNavigation: () => ({
    openFolderAtIndex: mockOpenFolderAtIndex,
    truncateToColumn: vi.fn(),
    setPreviewedFile: mockSetPreviewedFile,
    clearPreviewedFile: vi.fn(),
  }),
}))
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))
vi.mock('./useCopyUrl', () => ({ useCopyUrl: () => ({ onCopyUrl: vi.fn() }) }))

const makeItem = (name: string, type = STORAGE_ROW_TYPES.FILE): StorageItem => ({
  id: type === STORAGE_ROW_TYPES.FOLDER ? null : `id-${name}`,
  name,
  type,
  status: STORAGE_ROW_STATUS.READY,
  metadata: {
    cacheControl: '',
    contentLength: 1,
    size: 1,
    httpStatusCode: 200,
    eTag: '',
    lastModified: '',
    mimetype: 'image/png',
  },
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  isCorrupted: false,
})

const column: StorageColumn = {
  id: 'my-bucket',
  name: 'my-bucket',
  path: '',
  status: STORAGE_ROW_STATUS.READY,
  items: [makeItem('images', STORAGE_ROW_TYPES.FOLDER), makeItem('a.png'), makeItem('b.png')],
}

const renderColumn = ({ selectedItems = [] }: { selectedItems?: StorageItemWithColumn[] } = {}) =>
  render(
    <FileExplorerKeyboardNavigationProvider isListView={false}>
      <FileExplorerColumn index={0} column={column} selectedItems={selectedItems} />
    </FileExplorerKeyboardNavigationProvider>
  )

const getListbox = () => screen.getByRole('listbox', { name: 'Contents of my-bucket' })

/** Focusing is what makes the column the one being driven, so let that state settle */
const focusListbox = async () => {
  const listbox = getListbox()
  await act(async () => listbox.focus())
  return listbox
}

describe('FileExplorerColumn keyboard navigation', () => {
  beforeAll(() => {
    // The column virtualizes its rows, and jsdom reports every element as zero-sized,
    // which would leave it empty. Give the scroll container a viewport to render into.
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 400 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 640 })
  })

  afterAll(() => {
    // @ts-expect-error -- restoring jsdom's own zero-size getters
    delete HTMLElement.prototype.offsetHeight
    // @ts-expect-error -- restoring jsdom's own zero-size getters
    delete HTMLElement.prototype.offsetWidth
  })

  beforeEach(() => {
    mockOpenFolderAtIndex.mockReset()
    mockSetPreviewedFile.mockReset()
    mockUseStoragePreference.mockReturnValue({
      view: STORAGE_VIEWS.COLUMNS,
      setView: vi.fn(),
      setSortBy: vi.fn(),
      setSortByOrder: vi.fn(),
    })
    mockUseStorageExplorerStateSnapshot.mockReturnValue({
      projectRef: 'test-ref',
      columns: [column],
      openedFolders: [],
      selectedItems: [],
      selectedBucket: { id: 'my-bucket', name: 'my-bucket', public: false },
      selectedFilePreview: undefined,
      setSelectedItems: vi.fn(),
      setSelectedItemsToDelete: vi.fn(),
      setSelectedItemsToMove: vi.fn(),
      setSelectedItemToRename: vi.fn(),
      setSelectedFileCustomExpiry: vi.fn(),
      addNewFolderPlaceholder: vi.fn(),
      downloadFile: vi.fn(),
      downloadFolder: vi.fn(),
      selectRangeItems: vi.fn(),
    })
  })

  it('is a single tab stop that reports its rows as options', () => {
    renderColumn()

    expect(getListbox()).toHaveAttribute('tabindex', '0')
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('points at the row under the cursor as it moves', async () => {
    renderColumn()
    const listbox = getListbox()
    listbox.focus()

    const [folderRow, firstFileRow] = screen.getAllByRole('option')
    expect(listbox).toHaveAttribute('aria-activedescendant', folderRow.id)

    await userEvent.keyboard('{ArrowDown}')

    expect(listbox).toHaveAttribute('aria-activedescendant', firstFileRow.id)
  })

  it('reports which files are selected', () => {
    renderColumn({ selectedItems: [{ ...makeItem('a.png'), columnIndex: 0 }] })

    const [folderRow, firstFileRow] = screen.getAllByRole('option')
    expect(firstFileRow).toHaveAttribute('aria-selected', 'true')
    // Folders are not selectable, so they carry no selected state at all
    expect(folderRow).not.toHaveAttribute('aria-selected')
  })

  it('opens the folder the cursor is on with the arrow keys', async () => {
    renderColumn()
    getListbox().focus()

    await userEvent.keyboard('{ArrowRight}')

    expect(mockOpenFolderAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ name: 'images' }),
      { history: 'replace' }
    )
  })

  it('highlights the row under the cursor while the column has focus', async () => {
    renderColumn()
    await focusListbox()

    const [folderRow, firstFileRow] = screen.getAllByRole('option')
    expect(folderRow).toHaveClass('bg-foreground/10')
    expect(firstFileRow).not.toHaveClass('bg-foreground/10')
    // The cursor's background fills the row and the mouse cannot repaint it
    expect(folderRow).not.toHaveClass('hover:bg-panel-footer-light')
    // No row rounds off its background, whichever state it is in
    expect(folderRow).not.toHaveClass('rounded-sm')
    expect(firstFileRow).not.toHaveClass('rounded-sm')

    await userEvent.keyboard('{ArrowDown}')

    expect(firstFileRow).toHaveClass('bg-foreground/10')
    expect(folderRow).not.toHaveClass('bg-foreground/10')
  })

  it('previews the file the cursor is on with Enter', async () => {
    renderColumn()
    getListbox().focus()

    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(mockSetPreviewedFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'a.png', columnIndex: 0 })
    )
  })
})
