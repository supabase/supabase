import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import type { StorageItem } from '@/components/interfaces/Storage/Storage.types'
import { PreviewPane } from '@/components/interfaces/Storage/StorageExplorer/PreviewPane'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const { versioningEnabled, selectedBucket, selectedFilePreview } = vi.hoisted(() => ({
  versioningEnabled: { current: true },
  selectedBucket: {
    current: { id: 'my-bucket', name: 'my-bucket', public: false } as Record<string, unknown>,
  },
  selectedFilePreview: { current: undefined as Record<string, unknown> | undefined },
}))

vi.mock(
  '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext',
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, useIsStorageVersioningEnabled: () => versioningEnabled.current }
  }
)

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => ({
    projectRef: 'abcdef',
    selectedBucket: selectedBucket.current,
    selectedFilePreview: selectedFilePreview.current,
    openedFolders: [],
    setSelectedItemsToDelete: vi.fn(),
    setItemToPurge: vi.fn(),
    refetchAllOpenedFolders: vi.fn().mockResolvedValue(undefined),
    replaceFile: vi.fn(),
    setSelectedFileCustomExpiry: vi.fn(),
    downloadFile: vi.fn(),
  }),
}))
vi.mock('@/components/interfaces/Storage/StorageExplorer/StorageExplorerNavigation', () => ({
  useStorageExplorerNavigation: () => ({ clearPreviewedFile: vi.fn() }),
}))
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))
vi.mock('@/components/interfaces/Storage/StorageExplorer/useCopyUrl', () => ({
  useCopyUrl: () => ({ onCopyUrl: vi.fn() }),
}))

const FILE: StorageItem = {
  id: 'f1',
  name: 'photo.png',
  type: STORAGE_ROW_TYPES.FILE,
  status: STORAGE_ROW_STATUS.READY,
  metadata: {
    cacheControl: 'max-age=3600',
    contentLength: 10,
    size: 10,
    httpStatusCode: 200,
    eTag: 'etag',
    lastModified: '2024-01-01T00:00:00Z',
    mimetype: 'image/png',
  },
  isCorrupted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  last_accessed_at: null,
  path: 'photo.png',
}

const VERSIONS = [
  {
    id: 'f1',
    name: 'photo.png',
    version: 'v-current',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_accessed_at: null,
    archived_at: null,
    is_delete_marker: false,
    metadata: { size: 10, mimetype: 'image/png' },
  },
]

const renderPane = (file: Partial<StorageItem> = {}) => {
  selectedFilePreview.current = { ...FILE, ...file }
  return render(<PreviewPane />)
}

describe('PreviewPane', () => {
  beforeEach(() => {
    versioningEnabled.current = true
    selectedBucket.current = { id: 'my-bucket', name: 'my-bucket', public: false }

    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: () => Response.json(VERSIONS),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/sign',
      response: () => Response.json({ signedUrl: '/storage/v1/object/sign/photo.png' }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/storage/:ref/buckets/:id/lifecycle',
      response: () => Response.json({ rules: [] }),
    })
  })

  it('offers Archive and a purge on an enabled bucket', async () => {
    selectedBucket.current = { ...selectedBucket.current, versioning_status: 'ENABLED' }
    renderPane()

    expect(await screen.findByRole('button', { name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More delete options' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete file' })).not.toBeInTheDocument()
  })

  it('offers a single Delete on a suspended bucket', async () => {
    selectedBucket.current = { ...selectedBucket.current, versioning_status: 'SUSPENDED' }
    renderPane({ is_versioned: false })

    // Suspended can't soft-delete, so there is no Archive and no purge split button.
    expect(await screen.findByRole('button', { name: 'Delete file' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'More delete options' })).not.toBeInTheDocument()
  })

  it('keeps the Versions section on a suspended bucket, since it can still hold versions', async () => {
    selectedBucket.current = { ...selectedBucket.current, versioning_status: 'SUSPENDED' }
    renderPane({ is_versioned: true })

    expect(await screen.findByText('Versions')).toBeInTheDocument()
    expect(await screen.findByText('Versioning is suspended on this bucket')).toBeInTheDocument()
  })
})
