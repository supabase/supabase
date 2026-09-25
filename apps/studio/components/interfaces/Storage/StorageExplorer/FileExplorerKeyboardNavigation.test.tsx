import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageColumn, StorageItem } from '../Storage.types'
import {
  FileExplorerKeyboardNavigationProvider,
  useFileExplorerKeyboardNavigation,
} from './FileExplorerKeyboardNavigation'
import { customRender as render } from '@/tests/lib/custom-render'

const {
  mockUseStorageExplorerStateSnapshot,
  mockOpenFolderAtIndex,
  mockTruncateToColumn,
  mockSetPreviewedFile,
} = vi.hoisted(() => ({
  mockUseStorageExplorerStateSnapshot: vi.fn(),
  mockOpenFolderAtIndex: vi.fn(),
  mockTruncateToColumn: vi.fn(),
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
vi.mock('./StorageExplorerNavigation', () => ({
  useStorageExplorerNavigation: () => ({
    openFolderAtIndex: mockOpenFolderAtIndex,
    truncateToColumn: mockTruncateToColumn,
    setPreviewedFile: mockSetPreviewedFile,
  }),
}))

const makeItem = (name: string, type = STORAGE_ROW_TYPES.FILE): StorageItem => ({
  id: type === STORAGE_ROW_TYPES.FOLDER ? null : `id-${name}`,
  name,
  type,
  status: STORAGE_ROW_STATUS.READY,
  metadata: null,
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  isCorrupted: false,
})

const makeColumn = (name: string, items: StorageItem[]): StorageColumn => ({
  id: name,
  name,
  path: '',
  status: STORAGE_ROW_STATUS.READY,
  items,
})

/** my-bucket/[images, a.png] and, drilled into it, images/[b.png, c.png] */
const columns = [
  makeColumn('my-bucket', [makeItem('images', STORAGE_ROW_TYPES.FOLDER), makeItem('a.png')]),
  makeColumn('images', [makeItem('b.png'), makeItem('c.png')]),
]
const openedFolders = [makeItem('images', STORAGE_ROW_TYPES.FOLDER)]

/**
 * Stands in for the columns: the provider only needs each one to be focusable, to report
 * its keys, and to register its element.
 */
const Columns = () => {
  const {
    cursor,
    isListFocused,
    registerColumn,
    onColumnFocus,
    onColumnBlur,
    onColumnKeyDown,
    activateRow,
  } = useFileExplorerKeyboardNavigation()
  const snapshot = mockUseStorageExplorerStateSnapshot()

  return (
    <>
      <p data-testid="cursor">{`${cursor.columnIndex}:${cursor.itemIndex}`}</p>
      <p data-testid="is-focused">{String(isListFocused)}</p>
      <button>outside the list</button>
      {/* Stands in for the folder row in the bucket root being clicked */}
      <button onClick={() => activateRow({ columnIndex: 0, itemIndex: 0 })}>click images</button>
      {snapshot.columns.map((column: StorageColumn, index: number) => (
        <div
          key={column.id}
          role="listbox"
          aria-label={`Contents of ${column.name}`}
          tabIndex={0}
          ref={(element) => registerColumn(index, element)}
          onFocus={(event) => {
            if (event.target === event.currentTarget) onColumnFocus(index)
          }}
          onBlur={onColumnBlur}
          onKeyDown={(event) => onColumnKeyDown(index, event)}
        >
          <button>row action</button>
        </div>
      ))}
    </>
  )
}

const setSnapshot = (
  overrides: Partial<{
    columns: StorageColumn[]
    openedFolders: StorageItem[]
    selectedItems: (StorageItem & { columnIndex: number })[]
    setSelectedItems: () => void
    selectRangeItems: () => void
  }> = {}
) => {
  const snapshot = {
    columns,
    openedFolders,
    selectedItems: [],
    setSelectedItems: vi.fn(),
    selectRangeItems: vi.fn(),
    ...overrides,
  }
  mockUseStorageExplorerStateSnapshot.mockReturnValue(snapshot)
  return snapshot
}

const renderColumns = ({ isListView = false }: { isListView?: boolean } = {}) =>
  render(
    <FileExplorerKeyboardNavigationProvider isListView={isListView}>
      <Columns />
    </FileExplorerKeyboardNavigationProvider>
  )

/** Comfortably past the provider's activation debounce */
const ACTIVATION_SETTLED_MS = 400

const getCursor = () => screen.getByTestId('cursor').textContent
const focusColumn = async (name: string) => {
  const column = screen.getByRole('listbox', { name: `Contents of ${name}` })
  column.focus()
  await waitFor(() => expect(column).toHaveFocus())
  return column
}

describe('FileExplorerKeyboardNavigation', () => {
  beforeEach(() => {
    mockOpenFolderAtIndex.mockReset()
    mockTruncateToColumn.mockReset()
    mockSetPreviewedFile.mockReset()
    setSnapshot()
  })

  it('moves down and up through a folder, stopping at its ends', async () => {
    renderColumns()
    await focusColumn('my-bucket')
    expect(screen.getByTestId('is-focused')).toHaveTextContent('true')

    await userEvent.keyboard('{ArrowDown}')
    expect(getCursor()).toBe('0:1')

    // Already on the last row of the column
    await userEvent.keyboard('{ArrowDown}')
    expect(getCursor()).toBe('0:1')

    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(getCursor()).toBe('0:0')
  })

  it('jumps to the first and last row', async () => {
    renderColumns()
    await focusColumn('my-bucket')

    await userEvent.keyboard('{End}')
    expect(getCursor()).toBe('0:1')

    await userEvent.keyboard('{Home}')
    expect(getCursor()).toBe('0:0')
  })

  it('opens the folder under the cursor on ArrowRight', async () => {
    // Sitting at the bucket root with nothing drilled into yet
    setSnapshot({ columns: [columns[0]], openedFolders: [] })
    renderColumns()
    await focusColumn('my-bucket')

    await userEvent.keyboard('{ArrowRight}')

    expect(mockOpenFolderAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ name: 'images' }),
      // Browsing the columns should not fill up the Back button
      { history: 'replace' }
    )
  })

  it('takes focus into the folder it just opened, once its column is there', async () => {
    // The column for a folder only renders after the listing resolves, so focus has to
    // follow the cursor into it rather than move with the keystroke
    setSnapshot({ columns: [columns[0]], openedFolders: [] })
    mockOpenFolderAtIndex.mockImplementation(async () => {
      setSnapshot({ columns, openedFolders })
    })
    renderColumns()
    await focusColumn('my-bucket')

    await userEvent.keyboard('{ArrowRight}')

    await waitFor(() =>
      expect(screen.getByRole('listbox', { name: 'Contents of images' })).toHaveFocus()
    )
    expect(getCursor()).toBe('1:0')
  })

  it('opens a clicked folder as a navigation, leaving the cursor on it', async () => {
    setSnapshot({ columns: [columns[0]], openedFolders: [] })
    renderColumns()

    await userEvent.click(screen.getByRole('button', { name: 'click images' }))

    // A click is a deliberate move, so unlike browsing it earns a history entry
    expect(mockOpenFolderAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ name: 'images' }),
      { history: 'push' }
    )
    // The cursor stays on the folder, with its contents alongside it
    expect(getCursor()).toBe('0:0')
    expect(screen.getByRole('listbox', { name: 'Contents of my-bucket' })).toHaveFocus()
  })

  it('stays on an empty folder, which has no row to move onto', async () => {
    setSnapshot({ columns: [columns[0]], openedFolders: [] })
    mockOpenFolderAtIndex.mockImplementation(async () => {
      setSnapshot({ columns: [columns[0], makeColumn('images', [])], openedFolders })
    })
    renderColumns()
    await focusColumn('my-bucket')

    await userEvent.keyboard('{ArrowRight}')

    expect(mockOpenFolderAtIndex).toHaveBeenCalled()
    expect(getCursor()).toBe('0:0')
    expect(screen.getByRole('listbox', { name: 'Contents of my-bucket' })).toHaveFocus()
  })

  it('does not reopen a folder that is already drilled into', async () => {
    renderColumns()
    await focusColumn('my-bucket')

    // `images` is already open, so this is a move rather than a fetch
    await userEvent.keyboard('{ArrowRight}')

    expect(mockOpenFolderAtIndex).not.toHaveBeenCalled()
    expect(getCursor()).toBe('1:0')
  })

  it('does nothing on ArrowRight over a file', async () => {
    renderColumns()
    const column = await focusColumn('my-bucket')
    await userEvent.keyboard('{ArrowDown}')

    await userEvent.keyboard('{ArrowRight}')

    expect(mockOpenFolderAtIndex).not.toHaveBeenCalled()
    expect(getCursor()).toBe('0:1')
    expect(column).toHaveFocus()
  })

  it('leaves a folder on ArrowLeft, landing back on it', async () => {
    renderColumns()
    await focusColumn('images')
    expect(getCursor()).toBe('1:0')

    await userEvent.keyboard('{ArrowLeft}')

    // `images` is the first row of the bucket root, and stays open behind the cursor —
    // having a folder selected is what showing its contents means
    expect(getCursor()).toBe('0:0')
    expect(mockTruncateToColumn).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox', { name: 'Contents of my-bucket' })).toHaveFocus()
  })

  it('leaves a folder on Shift+Tab too, and tabs out of the list on plain Tab', async () => {
    renderColumns()
    await focusColumn('images')

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(getCursor()).toBe('0:0')

    await focusColumn('images')
    await userEvent.keyboard('{Tab}')
    expect(getCursor()).toBe('1:0')
  })

  it('has nothing to leave at the bucket root', async () => {
    renderColumns()
    await focusColumn('my-bucket')

    await userEvent.keyboard('{ArrowLeft}')

    expect(mockTruncateToColumn).not.toHaveBeenCalled()
  })

  it('opens the folder the cursor settles on, without being asked to', async () => {
    // Bucket root, nothing drilled into, cursor about to land on `images`
    setSnapshot({ columns: [columns[0]], openedFolders: [] })
    renderColumns()
    await focusColumn('my-bucket')
    await userEvent.keyboard('{ArrowDown}')
    expect(getCursor()).toBe('0:1')

    await userEvent.keyboard('{ArrowUp}')

    await waitFor(() =>
      expect(mockOpenFolderAtIndex).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ name: 'images' }),
        { history: 'replace' }
      )
    )
  })

  it('previews the file the cursor settles on, without being asked to', async () => {
    renderColumns()
    await focusColumn('my-bucket')

    await userEvent.keyboard('{ArrowDown}')

    expect(mockSetPreviewedFile, 'Should wait for the cursor to settle').not.toHaveBeenCalled()
    await waitFor(() =>
      expect(mockSetPreviewedFile).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'a.png', columnIndex: 0 })
      )
    )
  })

  it('only opens the row the cursor settles on, not the ones passed over', async () => {
    renderColumns()
    await focusColumn('my-bucket')

    // Down onto the file, back up onto the folder, down onto the file again
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{ArrowDown}')

    await waitFor(() => expect(mockSetPreviewedFile).toHaveBeenCalledTimes(1))
    expect(mockOpenFolderAtIndex).not.toHaveBeenCalled()
  })

  it('leaves a selection in progress alone while browsing past files', async () => {
    setSnapshot({ selectedItems: [{ ...makeItem('b.png'), columnIndex: 1 }] })
    renderColumns()
    await focusColumn('my-bucket')

    await userEvent.keyboard('{ArrowDown}')

    // Previewing clears the selection, so browsing does not preview while one is being built
    await new Promise((resolve) => setTimeout(resolve, ACTIVATION_SETTLED_MS))
    expect(mockSetPreviewedFile).not.toHaveBeenCalled()
  })

  it('previews the file under the cursor on Enter, without waiting', async () => {
    renderColumns()
    await focusColumn('images')

    await userEvent.keyboard('{Enter}')

    // Choosing a row outright, so it does not sit out the debounce
    expect(mockSetPreviewedFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'b.png', columnIndex: 1 })
    )
  })

  it('previews on Enter even with a selection in progress', async () => {
    setSnapshot({ selectedItems: [{ ...makeItem('c.png'), columnIndex: 1 }] })
    renderColumns()
    await focusColumn('images')

    await userEvent.keyboard('{Enter}')

    expect(mockSetPreviewedFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'b.png', columnIndex: 1 })
    )
  })

  it('opens the folder under the cursor on Enter', async () => {
    renderColumns()
    await focusColumn('my-bucket')

    await userEvent.keyboard('{Enter}')

    expect(mockSetPreviewedFile).not.toHaveBeenCalled()
    expect(getCursor()).toBe('1:0')
  })

  it('selects the file under the cursor on Space', async () => {
    const setSelectedItems = vi.fn()
    setSnapshot({ setSelectedItems })
    renderColumns()
    await focusColumn('images')

    await userEvent.keyboard('{ }')

    expect(setSelectedItems).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'b.png', columnIndex: 1 }),
    ])
  })

  it('deselects a file that is already selected', async () => {
    const setSelectedItems = vi.fn()
    setSnapshot({
      selectedItems: [{ ...makeItem('b.png'), columnIndex: 1 }],
      setSelectedItems,
    })
    renderColumns()
    await focusColumn('images')

    await userEvent.keyboard('{ }')

    expect(setSelectedItems).toHaveBeenCalledWith([])
  })

  it('extends the selection on Shift+Space', async () => {
    const selectRangeItems = vi.fn()
    setSnapshot({ selectedItems: [{ ...makeItem('b.png'), columnIndex: 1 }], selectRangeItems })
    renderColumns()
    await focusColumn('images')
    await userEvent.keyboard('{ArrowDown}')

    await userEvent.keyboard('{Shift>} {/Shift}')

    expect(selectRangeItems).toHaveBeenCalledWith(1, 1)
  })

  it('does not select a folder', async () => {
    const setSelectedItems = vi.fn()
    setSnapshot({ setSelectedItems })
    renderColumns()
    await focusColumn('my-bucket')

    await userEvent.keyboard('{ }')

    expect(setSelectedItems).not.toHaveBeenCalled()
  })

  it('leaves keys typed inside a row control to that control', async () => {
    renderColumns()
    await focusColumn('my-bucket')
    const rowAction = screen.getAllByRole('button', { name: 'row action' })[0]
    rowAction.focus()

    await userEvent.keyboard('{ArrowDown}')

    expect(getCursor()).toBe('0:0')
  })

  it('takes the cursor along when focus moves to another column', async () => {
    renderColumns()
    await focusColumn('my-bucket')
    await userEvent.keyboard('{ArrowDown}')
    expect(getCursor()).toBe('0:1')

    await focusColumn('images')

    expect(getCursor()).toBe('1:0')
  })

  it('moves focus into the list from outside it', async () => {
    renderColumns()
    const outside = screen.getByRole('button', { name: 'outside the list' })
    outside.focus()
    expect(screen.getByTestId('is-focused')).toHaveTextContent('false')

    await userEvent.keyboard('{ArrowDown}')

    await waitFor(() =>
      expect(screen.getByRole('listbox', { name: 'Contents of my-bucket' })).toHaveFocus()
    )
    expect(getCursor()).toBe('0:0')
  })

  it('does not open folders it passes over in list view', async () => {
    // List view renders one folder at a time, so auto-opening would march the whole view
    // down the tree as the cursor moves
    setSnapshot({ columns: [columns[0]], openedFolders: [] })
    renderColumns({ isListView: true })
    await focusColumn('my-bucket')

    await userEvent.keyboard('{ArrowDown}{ArrowUp}')

    await new Promise((resolve) => setTimeout(resolve, ACTIVATION_SETTLED_MS))
    expect(mockOpenFolderAtIndex).not.toHaveBeenCalled()
  })

  it('closes the folder when leaving it in list view', async () => {
    renderColumns({ isListView: true })
    await focusColumn('images')

    await userEvent.keyboard('{ArrowLeft}')

    // Nothing would be on screen otherwise: the column being left is the only one rendered
    expect(mockTruncateToColumn).toHaveBeenCalledWith(0)
  })

  it('enters the deepest column in list view, where only it is on screen', async () => {
    renderColumns({ isListView: true })

    expect(getCursor()).toBe('1:0')
  })
})
