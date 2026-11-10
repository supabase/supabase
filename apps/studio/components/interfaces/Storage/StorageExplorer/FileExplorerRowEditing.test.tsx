import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageItem } from '../Storage.types'
import { FileExplorerRowEditing } from './FileExplorerRowEditing'

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => ({
    renameFile: vi.fn(),
    renameFolder: vi.fn(),
    addNewFolder: vi.fn(),
    updateRowStatus: vi.fn(),
  }),
}))

describe('FileExplorerRowEditing', () => {
  test.each([
    {
      description: 'the entire folder name when it contains a dot',
      name: 'photos.backup',
      type: STORAGE_ROW_TYPES.FOLDER,
      expectedSelection: 'photos.backup',
    },
    {
      description: 'the entire folder name when it has no extension',
      name: 'photos',
      type: STORAGE_ROW_TYPES.FOLDER,
      expectedSelection: 'photos',
    },
    {
      description: 'the file name without its extension',
      name: 'photo.png',
      type: STORAGE_ROW_TYPES.FILE,
      expectedSelection: 'photo',
    },
  ])('selects $description on entering rename mode', ({ name, type, expectedSelection }) => {
    const item: StorageItem = {
      id: null,
      name,
      type,
      status: STORAGE_ROW_STATUS.EDITING,
      metadata: null,
      created_at: null,
      updated_at: null,
      last_accessed_at: null,
      isCorrupted: false,
    }

    render(<FileExplorerRowEditing item={item} view={STORAGE_VIEWS.COLUMNS} columnIndex={0} />)

    const input = screen.getByRole<HTMLInputElement>('textbox')

    expect(input).toHaveFocus()
    expect(input.selectionStart).toBe(0)
    expect(input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0)).toBe(
      expectedSelection
    )
  })
})
