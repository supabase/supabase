import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
  STORAGE_VIEWS,
} from '@/components/interfaces/Storage/Storage.constants'
import type {
  StorageItem,
  StorageItemMetadata,
} from '@/components/interfaces/Storage/Storage.types'
import { FileExplorerRow } from '@/components/interfaces/Storage/StorageExplorer/FileExplorerRow'
import { customRender as render } from '@/tests/lib/custom-render'

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => ({
    projectRef: 'abcdef',
    selectedBucket: { id: 'my-bucket', name: 'my-bucket', public: false },
    selectedFilePreview: undefined,
    openedFolders: [],
    setSelectedFileCustomExpiry: vi.fn(),
    setSelectedItems: vi.fn(),
    setSelectedItemsToDelete: vi.fn(),
    downloadFile: vi.fn(),
    setSelectedItemToRename: vi.fn(),
    setSelectedItemsToMove: vi.fn(),
    downloadFolder: vi.fn(),
    selectRangeItems: vi.fn(),
  }),
}))
vi.mock('@/components/interfaces/Storage/StorageExplorer/StorageExplorerNavigation', () => ({
  useStorageExplorerNavigation: () => ({
    openFolderAtIndex: vi.fn(),
    truncateToColumn: vi.fn(),
    setPreviewedFile: vi.fn(),
    clearPreviewedFile: vi.fn(),
  }),
}))
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))
vi.mock('@/components/interfaces/Storage/StorageExplorer/useCopyUrl', () => ({
  useCopyUrl: () => ({ onCopyUrl: vi.fn() }),
}))

const METADATA: StorageItemMetadata = {
  cacheControl: 'max-age=3600',
  contentLength: 10,
  size: 10,
  httpStatusCode: 200,
  eTag: 'etag',
  lastModified: '2024-01-01T00:00:00Z',
  mimetype: 'image/png',
}

const item = (overrides: Partial<StorageItem>): StorageItem => ({
  id: null,
  name: 'photo.png',
  type: STORAGE_ROW_TYPES.FILE,
  status: STORAGE_ROW_STATUS.READY,
  metadata: METADATA,
  isCorrupted: false,
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  path: 'photo.png',
  ...overrides,
})

describe('FileExplorerRow', () => {
  it('offers both the relative path and the dashboard URL for a file', async () => {
    render(
      <FileExplorerRow
        item={item({ id: 'f1' })}
        index={0}
        view={STORAGE_VIEWS.COLUMNS}
        columnIndex={0}
        selectedItems={[]}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'photo.png actions' }))
    expect(await screen.findByText('Copy relative path')).toBeInTheDocument()
    expect(screen.getByText('Copy link')).toBeInTheDocument()
  })

  it('offers both the relative path and the dashboard URL for a folder', async () => {
    render(
      <FileExplorerRow
        item={item({ name: 'avatars', type: STORAGE_ROW_TYPES.FOLDER, metadata: null })}
        index={0}
        view={STORAGE_VIEWS.COLUMNS}
        columnIndex={0}
        selectedItems={[]}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'avatars actions' }))
    expect(await screen.findByText('Copy relative path')).toBeInTheDocument()
    expect(screen.getByText('Copy link')).toBeInTheDocument()
    expect(screen.queryByText('Copy path to folder')).not.toBeInTheDocument()
  })

  it('marks an archived file with an icon in the leading slot rather than a text badge', async () => {
    const { container } = render(
      <FileExplorerRow
        item={item({ id: 'f2', name: 'gone.png', archived: { archivedObjectId: 'a1' } })}
        index={0}
        view={STORAGE_VIEWS.COLUMNS}
        columnIndex={0}
        selectedItems={[]}
      />
    )

    // The icon reads as a button, not the word "Archived", and sits where the file icon would.
    const archivedIcon = screen.getByRole('button', { name: 'View archived file gone.png' })
    expect(screen.queryByText('Archived')).not.toBeInTheDocument()
    expect(container.querySelector('.w-\\[30px\\]')).toContainElement(archivedIcon)

    // Only the actions an archived file can actually take.
    await userEvent.click(screen.getByRole('button', { name: 'gone.png actions' }))
    expect(await screen.findByText('Restore')).toBeInTheDocument()
    expect(screen.getByText('Delete permanently')).toBeInTheDocument()
    expect(screen.queryByText('Download')).not.toBeInTheDocument()
    expect(screen.queryByText('Rename')).not.toBeInTheDocument()
    expect(screen.queryByText('Move')).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')

    // The archive icon replaces the file icon outright, so there is nothing left to
    // hide on hover and no checkbox to swap in.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(container.querySelector('.absolute')).toBeNull()
  })

  it('gives an archived folder the same actions, since its contents are what they act on', async () => {
    render(
      <FileExplorerRow
        item={item({
          name: 'matches',
          type: STORAGE_ROW_TYPES.FOLDER,
          metadata: null,
          archived: {},
        })}
        index={0}
        view={STORAGE_VIEWS.COLUMNS}
        columnIndex={0}
        selectedItems={[]}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'matches actions' }))
    expect(await screen.findByText('Restore')).toBeInTheDocument()
    expect(screen.getByText('Delete permanently')).toBeInTheDocument()
    // The live folder actions have no archived equivalent.
    expect(screen.queryByText('Download')).not.toBeInTheDocument()
    expect(screen.queryByText('Rename')).not.toBeInTheDocument()
  })

  it('keeps hiding the icon on hover for a live file, which does swap in a checkbox', () => {
    const { container } = render(
      <FileExplorerRow
        item={item({ id: 'f3', name: 'live.png' })}
        index={0}
        view={STORAGE_VIEWS.COLUMNS}
        columnIndex={0}
        selectedItems={[]}
      />
    )

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(container.querySelector('.absolute')?.className).toContain('group-hover:hidden')
  })
})
