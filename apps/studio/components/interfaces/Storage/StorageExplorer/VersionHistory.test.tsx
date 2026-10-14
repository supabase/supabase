import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { VersionHistory } from '@/components/interfaces/Storage/StorageExplorer/VersionHistory'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const refetchAllOpenedFolders = vi.fn().mockResolvedValue(undefined)

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => ({
    refetchAllOpenedFolders,
    // The thumbnails resolve an image version's own bytes through the bucket.
    projectRef: 'abcdef',
    selectedBucket: { id: 'my-bucket', name: 'my-bucket', public: true },
  }),
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

const renderHistory = (props: Partial<ComponentProps<typeof VersionHistory>> = {}) =>
  render(
    <VersionHistory
      projectRef="abcdef"
      bucketId="my-bucket"
      objectName="photo.png"
      path="images/photo.png"
      versioningState="enabled"
      willRetainVersionOnWrite
      lifecyclePolicy={{ expiryDays: null, maxVersions: null }}
      expirationMode="and"
      clearPreview={vi.fn()}
      onEditBucket={vi.fn()}
      {...props}
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
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/public-url',
      response: () => Response.json({ publicUrl: 'https://example.com/photo.png' }),
    })

    renderHistory()

    await userEvent.click(await screen.findByRole('button', { name: /Actions for version/ }))
    await userEvent.click(await screen.findByText('Restore as current'))

    // A restore changes the object's size, type and modified date, and the row
    // showing them lives in the explorer's state rather than a React Query cache.
    await waitFor(() => expect(refetchAllOpenedFolders).toHaveBeenCalled())
  })

  describe('empty state', () => {
    const mockEmptyListing = () =>
      addAPIMock({
        method: 'post',
        path: '/platform/storage/:ref/buckets/:id/objects/list',
        response: () => Response.json([]),
      })

    it('promises retention on an enabled bucket', async () => {
      mockEmptyListing()
      renderHistory()

      expect(
        await screen.findByText(/Overwriting this file will retain a recoverable copy/)
      ).toBeInTheDocument()
    })

    it('promises retention on a suspended bucket when the file predates the suspension', async () => {
      mockEmptyListing()
      renderHistory({ versioningState: 'suspended', willRetainVersionOnWrite: true })

      expect(
        await screen.findByText(/Overwriting this file will retain a recoverable copy/)
      ).toBeInTheDocument()
    })
  })

  describe('suspended notice', () => {
    it('promises one last retained version for a file that predates the suspension', async () => {
      addAPIMock({
        method: 'post',
        path: '/platform/storage/:ref/buckets/:id/objects/list',
        response: () => Response.json(VERSIONS),
      })
      renderHistory({ versioningState: 'suspended', willRetainVersionOnWrite: true })

      expect(
        await screen.findByText(/retains the current version one last time/)
      ).toBeInTheDocument()
    })

    it('says the file is overwritten in place once the one-shot retention is spent', async () => {
      addAPIMock({
        method: 'post',
        path: '/platform/storage/:ref/buckets/:id/objects/list',
        response: () => Response.json(VERSIONS),
      })
      renderHistory({ versioningState: 'suspended', willRetainVersionOnWrite: false })

      // The versions already listed are still restorable, so the notice has to say so.
      expect(await screen.findByText(/overwrites it in place/)).toBeInTheDocument()
      expect(screen.getByText(/stay retained/)).toBeInTheDocument()
    })

    it('stays out of the way on an enabled bucket', async () => {
      addAPIMock({
        method: 'post',
        path: '/platform/storage/:ref/buckets/:id/objects/list',
        response: () => Response.json(VERSIONS),
      })
      renderHistory({ versioningState: 'enabled' })

      await screen.findByRole('button', { name: /Actions for version/ })
      expect(screen.queryByText(/Versioning is suspended/)).not.toBeInTheDocument()
    })
  })
})
