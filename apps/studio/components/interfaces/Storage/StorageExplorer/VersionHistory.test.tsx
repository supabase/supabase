import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { VersionHistory } from '@/components/interfaces/Storage/StorageExplorer/VersionHistory'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const refetchAllOpenedFolders = vi.fn().mockResolvedValue(undefined)

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => ({ refetchAllOpenedFolders }),
}))
// The versions query is platform-only, and `IS_PLATFORM` is false under vitest.
vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, IS_PLATFORM: true }
})

const VERSIONS = [
  {
    id: 'obj-1',
    name: 'photo.png',
    version: 'v-current',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    last_accessed_at: null,
    archived_at: null,
    is_delete_marker: false,
    metadata: { size: 200, mimetype: 'image/png' },
  },
  {
    id: 'obj-1',
    name: 'photo.png',
    version: 'v-older',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_accessed_at: null,
    // Anything with an `archived_at` is a noncurrent version, which is what can be restored.
    archived_at: '2024-01-02T00:00:00Z',
    is_delete_marker: false,
    metadata: { size: 100, mimetype: 'image/png' },
  },
]

const renderHistory = () =>
  render(
    <VersionHistory
      projectRef="abcdef"
      bucketId="my-bucket"
      objectName="photo.png"
      path="images/photo.png"
      versioningState="enabled"
      lifecyclePolicy={{ expiryDays: null, maxVersions: null }}
      expirationMode="and"
      clearPreview={vi.fn()}
      onEditBucket={vi.fn()}
    />
  )

describe('VersionHistory', () => {
  it('refreshes the listing after a restore, so the row stops showing the old size', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: () => Response.json(VERSIONS),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/move',
      response: () => Response.json({ message: 'ok' }),
    })

    renderHistory()

    await userEvent.click(await screen.findByRole('button', { name: /Actions for version/ }))
    await userEvent.click(await screen.findByText('Restore as current'))

    // A restore changes the object's size, type and modified date, and the row
    // showing them lives in the explorer's state rather than a React Query cache.
    await waitFor(() => expect(refetchAllOpenedFolders).toHaveBeenCalled())
  })
})
