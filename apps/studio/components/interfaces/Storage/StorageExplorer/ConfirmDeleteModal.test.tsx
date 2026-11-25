import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import type { StorageItemWithColumn } from '@/components/interfaces/Storage/Storage.types'
import { ConfirmDeleteModal } from '@/components/interfaces/Storage/StorageExplorer/ConfirmDeleteModal'
import { customRender as render } from '@/tests/lib/custom-render'

const { selectedItemsToDelete } = vi.hoisted(() => ({
  selectedItemsToDelete: { current: [] as StorageItemWithColumn[] },
}))

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => ({
    selectedBucket: { id: 'my-bucket', name: 'my-bucket', public: false },
    selectedItemsToDelete: selectedItemsToDelete.current,
    deleteFolder: vi.fn(),
    deleteFiles: vi.fn(),
    setSelectedItemsToDelete: vi.fn(),
  }),
}))

const buildItem = (name: string, type: StorageItemWithColumn['type']): StorageItemWithColumn => ({
  id: name,
  name,
  type,
  status: STORAGE_ROW_STATUS.READY,
  metadata: null,
  isCorrupted: false,
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  columnIndex: 0,
})

describe('ConfirmDeleteModal', () => {
  beforeEach(() => {
    selectedItemsToDelete.current = []
  })

  it('warns that deleting a folder also deletes the files inside it', () => {
    selectedItemsToDelete.current = [buildItem('dest', STORAGE_ROW_TYPES.FOLDER)]
    render(<ConfirmDeleteModal />)

    expect(screen.getByText('Delete dest?')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Deleting the selected folder will permanently delete it and every file inside it.'
      )
    ).toBeInTheDocument()
  })

  it('keeps the existing confirmation for a single file', () => {
    selectedItemsToDelete.current = [buildItem('report.pdf', STORAGE_ROW_TYPES.FILE)]
    render(<ConfirmDeleteModal />)

    expect(screen.getByText('Delete report.pdf?')).toBeInTheDocument()
    expect(
      screen.getByText('Are you sure you want to delete the selected file?')
    ).toBeInTheDocument()
  })
})
