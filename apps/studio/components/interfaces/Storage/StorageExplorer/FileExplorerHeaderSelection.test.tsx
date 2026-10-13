import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import type { StorageItemWithColumn } from '@/components/interfaces/Storage/Storage.types'
import { FileExplorerHeaderSelection } from '@/components/interfaces/Storage/StorageExplorer/FileExplorerHeaderSelection'
import { customRender as render } from '@/tests/lib/custom-render'

const { versioningEnabled, selectedBucket, actions } = vi.hoisted(() => ({
  versioningEnabled: { current: true },
  selectedBucket: {
    current: { id: 'my-bucket', name: 'my-bucket', public: false } as Record<string, unknown>,
  },
  actions: {
    setSelectedItemsToDelete: vi.fn(),
    setItemsToPurge: vi.fn(),
  },
}))

vi.mock(
  '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext',
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, useIsStorageVersioningEnabled: () => versioningEnabled.current }
  }
)

const SELECTED: StorageItemWithColumn[] = [
  {
    id: 'file-1',
    name: 'photo.png',
    type: STORAGE_ROW_TYPES.FILE,
    status: STORAGE_ROW_STATUS.READY,
    metadata: null,
    isCorrupted: false,
    created_at: null,
    updated_at: null,
    last_accessed_at: null,
    columnIndex: 0,
  },
  {
    id: 'file-2',
    name: 'notes.txt',
    type: STORAGE_ROW_TYPES.FILE,
    status: STORAGE_ROW_STATUS.READY,
    metadata: null,
    isCorrupted: false,
    created_at: null,
    updated_at: null,
    last_accessed_at: null,
    columnIndex: 0,
  },
]

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => ({
    selectedBucket: selectedBucket.current,
    selectedItems: SELECTED,
    downloadFile: vi.fn(),
    downloadSelectedFiles: vi.fn(),
    clearSelectedItems: vi.fn(),
    setSelectedItemsToMove: vi.fn(),
    ...actions,
  }),
}))
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))

describe('FileExplorerHeaderSelection', () => {
  beforeEach(() => {
    versioningEnabled.current = true
    selectedBucket.current = {
      id: 'my-bucket',
      name: 'my-bucket',
      public: false,
      versioning_status: 'ENABLED',
    }
    actions.setSelectedItemsToDelete.mockClear()
    actions.setItemsToPurge.mockClear()
  })

  it('offers a permanent delete beside the archive, since archiving leaves versions behind', async () => {
    render(<FileExplorerHeaderSelection />)

    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Delete permanently' }))

    expect(actions.setItemsToPurge).toHaveBeenCalledWith(SELECTED)
    expect(actions.setSelectedItemsToDelete).not.toHaveBeenCalled()
  })

  it('archives through the separate action, which keeps the versions', async () => {
    render(<FileExplorerHeaderSelection />)

    await userEvent.click(screen.getByRole('button', { name: 'Archive' }))

    expect(actions.setSelectedItemsToDelete).toHaveBeenCalledWith(SELECTED)
    expect(actions.setItemsToPurge).not.toHaveBeenCalled()
  })

  it('drops the permanent delete on a suspended bucket, where deleting is already permanent', () => {
    selectedBucket.current = { ...selectedBucket.current, versioning_status: 'SUSPENDED' }

    render(<FileExplorerHeaderSelection />)

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete permanently' })).not.toBeInTheDocument()
  })

  it('drops it on an unversioned bucket too, so the bar never says the same thing twice', () => {
    selectedBucket.current = { id: 'my-bucket', name: 'my-bucket', public: false }

    render(<FileExplorerHeaderSelection />)

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete permanently' })).not.toBeInTheDocument()
  })

  it('drops it when the feature preview is off', () => {
    versioningEnabled.current = false

    render(<FileExplorerHeaderSelection />)

    expect(screen.queryByRole('button', { name: 'Delete permanently' })).not.toBeInTheDocument()
  })
})
