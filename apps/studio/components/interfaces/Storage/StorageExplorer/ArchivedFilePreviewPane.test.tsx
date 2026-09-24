import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ArchivedFilePreviewPane } from '@/components/interfaces/Storage/StorageExplorer/ArchivedFilePreviewPane'
import type { ArchivedObject } from '@/data/storage/versioning/archived-objects-query'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const refetchAllOpenedFolders = vi.fn().mockResolvedValue(undefined)
const clearArchivedSelection = vi.fn()

const ARCHIVED_OBJECT: ArchivedObject = {
  id: 'delete-marker-1',
  path: 'images/gone.png',
  archivedAt: '2024-01-02T00:00:00Z',
  currentVersion: {
    versionId: 'v-current',
    size: 100,
    createdAt: '2024-01-01T00:00:00Z',
    action: 'initial upload',
  },
  noncurrentVersions: [],
}

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => ({
    projectRef: 'abcdef',
    selectedBucket: { id: 'my-bucket', name: 'my-bucket', public: false },
    refetchAllOpenedFolders,
  }),
}))
vi.mock('@/components/interfaces/Storage/StorageExplorer/ArchivedFilesContext', () => ({
  useArchivedFilesContext: () => ({
    selectedArchivedObject: ARCHIVED_OBJECT,
    selectedArchivedVersion: undefined,
    setSelectedArchivedVersion: vi.fn(),
    clearArchivedSelection,
  }),
}))
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))

describe('ArchivedFilePreviewPane', () => {
  it('refreshes the live listing after a restore, so the file reappears', async () => {
    addAPIMock({
      method: 'delete',
      path: '/platform/storage/:ref/buckets/:id/objects',
      response: () => Response.json({}),
    })

    render(<ArchivedFilePreviewPane />)

    await userEvent.click(screen.getByRole('button', { name: /restore/i }))

    // Without this the archived row goes but the restored file stays invisible:
    // the live listing is the explorer's own state, not a React Query cache.
    await waitFor(() => expect(refetchAllOpenedFolders).toHaveBeenCalled())
    expect(clearArchivedSelection).toHaveBeenCalled()
  })
})
