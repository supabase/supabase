import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_ROW_STATUS, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageColumn } from '../Storage.types'
import { FileExplorer } from './FileExplorer'

const { mockUseStorageExplorerStateSnapshot, mockUseStoragePreference } = vi.hoisted(() => ({
  mockUseStorageExplorerStateSnapshot: vi.fn(),
  mockUseStoragePreference: vi.fn(),
}))

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => mockUseStorageExplorerStateSnapshot(),
}))
vi.mock('./useStoragePreference', () => ({
  useStoragePreference: () => mockUseStoragePreference(),
}))
// The columns themselves are irrelevant here — only the scroll container's geometry is.
vi.mock('./FileExplorerColumn', () => ({
  FileExplorerColumn: () => <div data-testid="column" />,
}))

const COLUMN_WIDTH = 256
const CONTAINER_WIDTH = 600
const PREVIEW_PANE_WIDTH = 450

function makeColumns(count: number): StorageColumn[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `col-${index}`,
    name: `col-${index}`,
    path: '',
    status: STORAGE_ROW_STATUS.READY,
    items: [],
  }))
}

/**
 * jsdom reports every element as zero-sized, so the scroll container's geometry is
 * defined by hand: total width grows with the column count, and the visible width
 * shrinks while the preview pane is open.
 */
function applyLayout(
  container: HTMLElement,
  { columnCount, isPreviewOpen }: { columnCount: number; isPreviewOpen: boolean }
) {
  Object.defineProperty(container, 'scrollWidth', {
    configurable: true,
    get: () => columnCount * COLUMN_WIDTH,
  })
  Object.defineProperty(container, 'clientWidth', {
    configurable: true,
    get: () => CONTAINER_WIDTH - (isPreviewOpen ? PREVIEW_PANE_WIDTH : 0),
  })
}

/** The callbacks have runtime defaults but are required by the prop type. */
const noopProps = {
  selectedItems: [],
  itemSearchString: '',
  onFilesUpload: vi.fn(),
  onSelectAllItemsInColumn: vi.fn(),
  onSelectColumnEmptySpace: vi.fn(),
  onColumnLoadMore: vi.fn(),
}

function getScrollContainer() {
  const container = document.querySelector('.file-explorer')
  if (!(container instanceof HTMLElement)) throw new Error('scroll container not found')
  return container
}

describe('FileExplorer horizontal scroll', () => {
  beforeEach(() => {
    mockUseStorageExplorerStateSnapshot.mockReset()
    mockUseStoragePreference.mockReset()
    mockUseStoragePreference.mockReturnValue({ view: STORAGE_VIEWS.COLUMNS })
    mockUseStorageExplorerStateSnapshot.mockReturnValue({
      projectRef: 'test-ref',
      selectedFilePreview: undefined,
    })
  })

  it('scrolls the deepest column into view', () => {
    const columns = makeColumns(4)
    const { rerender } = render(<FileExplorer columns={[]} {...noopProps} />)

    const container = getScrollContainer()
    applyLayout(container, { columnCount: 4, isPreviewOpen: false })
    rerender(<FileExplorer columns={columns} {...noopProps} />)

    expect(container.scrollLeft).toBe(4 * COLUMN_WIDTH - CONTAINER_WIDTH)
  })

  it('re-scrolls when the preview pane opens and takes width off the container', () => {
    const columns = makeColumns(4)
    const { rerender } = render(<FileExplorer columns={columns} {...noopProps} />)

    const container = getScrollContainer()
    applyLayout(container, { columnCount: 4, isPreviewOpen: false })
    rerender(<FileExplorer columns={columns} {...noopProps} />)
    const scrollBeforePreview = container.scrollLeft

    // Deep-link restore opens the preview in a later commit, shrinking the viewport
    act(() => {
      mockUseStorageExplorerStateSnapshot.mockReturnValue({
        projectRef: 'test-ref',
        selectedFilePreview: { id: 'file-1', name: 'app icon-2.svg', columnIndex: 3 },
      })
      applyLayout(container, { columnCount: 4, isPreviewOpen: true })
    })
    rerender(<FileExplorer columns={columns} {...noopProps} />)

    expect(container.scrollLeft).toBe(4 * COLUMN_WIDTH - (CONTAINER_WIDTH - PREVIEW_PANE_WIDTH))
    expect(container.scrollLeft).toBeGreaterThan(scrollBeforePreview)
  })

  it('does not scroll in list view', () => {
    mockUseStoragePreference.mockReturnValue({ view: STORAGE_VIEWS.LIST })
    const columns = makeColumns(4)
    const { rerender } = render(<FileExplorer columns={[]} {...noopProps} />)

    const container = getScrollContainer()
    applyLayout(container, { columnCount: 4, isPreviewOpen: false })
    rerender(<FileExplorer columns={columns} {...noopProps} />)

    expect(container.scrollLeft).toBe(0)
  })
})
