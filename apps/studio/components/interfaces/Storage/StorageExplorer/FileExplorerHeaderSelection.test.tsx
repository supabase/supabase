import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MAX_ITEMS_PER_MOVE, STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import { FileExplorerHeaderSelection } from './FileExplorerHeaderSelection'
import { customRender as render } from '@/tests/lib/custom-render'

const { mockUseStorageExplorerStateSnapshot, mockUseAsyncCheckPermissions } = vi.hoisted(() => ({
  mockUseStorageExplorerStateSnapshot: vi.fn(),
  mockUseAsyncCheckPermissions: vi.fn(),
}))

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => mockUseStorageExplorerStateSnapshot(),
}))
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => mockUseAsyncCheckPermissions(),
}))

const createSelection = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `file-${index}`,
    name: `file-${index}.png`,
    type: STORAGE_ROW_TYPES.FILE,
    status: STORAGE_ROW_STATUS.READY,
    metadata: null,
    created_at: null,
    updated_at: null,
    last_accessed_at: null,
    isCorrupted: false,
    columnIndex: 0,
  }))

const createSnapshot = (selectedItemsCount: number, isMovingItems = false) => ({
  selectedItems: createSelection(selectedItemsCount),
  isMovingItems,
  downloadFile: vi.fn(),
  downloadSelectedFiles: vi.fn(),
  clearSelectedItems: vi.fn(),
  setSelectedItemsToDelete: vi.fn(),
  setSelectedItemsToMove: vi.fn(),
})

describe('FileExplorerHeaderSelection', () => {
  beforeEach(() => {
    mockUseStorageExplorerStateSnapshot.mockReset()
    mockUseAsyncCheckPermissions.mockReset()
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true })
  })

  it('allows moving a selection at the limit', () => {
    mockUseStorageExplorerStateSnapshot.mockReturnValue(createSnapshot(MAX_ITEMS_PER_MOVE))

    render(<FileExplorerHeaderSelection />)

    // ButtonTooltip marks itself aria-disabled so that the tooltip stays reachable
    expect(screen.getByRole('button', { name: 'Move' })).not.toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('disables moving a selection over the limit', () => {
    mockUseStorageExplorerStateSnapshot.mockReturnValue(createSnapshot(MAX_ITEMS_PER_MOVE + 1))

    render(<FileExplorerHeaderSelection />)

    expect(screen.getByRole('button', { name: 'Move' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('disables moving while another move is still running', () => {
    mockUseStorageExplorerStateSnapshot.mockReturnValue(createSnapshot(1, true))

    render(<FileExplorerHeaderSelection />)

    expect(screen.getByRole('button', { name: 'Move' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('keeps delete and download available over the move limit', () => {
    mockUseStorageExplorerStateSnapshot.mockReturnValue(createSnapshot(MAX_ITEMS_PER_MOVE + 1))

    render(<FileExplorerHeaderSelection />)

    expect(screen.getByRole('button', { name: 'Delete' })).not.toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled()
  })
})
