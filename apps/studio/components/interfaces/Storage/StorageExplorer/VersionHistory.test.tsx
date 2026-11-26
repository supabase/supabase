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

    const versionActions = await screen.findByRole('button', { name: /Actions for version/ })
    // No suspended notice on an enabled bucket
    expect(screen.queryByText(/Versioning is suspended/)).not.toBeInTheDocument()
    await userEvent.click(versionActions)
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

  it('shows version details and calculates expiration from when it was archived', async () => {
    const archivedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: () =>
        Response.json([
          ...VERSIONS.slice(0, 1),
          { ...VERSIONS[1], created_at: '2020-01-01T00:00:00Z', archived_at: archivedAt },
        ]),
    })

    renderHistory({ lifecyclePolicy: { expiryDays: 30, maxVersions: null } })

    expect(await screen.findByText('100 bytes')).toBeInTheDocument()
    const countdown = await screen.findByText('28d')
    await userEvent.hover(countdown)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Expires in 28 days')
    await userEvent.unhover(countdown)
    await userEvent.click(await screen.findByRole('button', { name: /Actions for version/ }))

    expect(await screen.findByText('Archived')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Lifecycle')).toBeInTheDocument()
    expect(screen.getByText('Expires in 28 days.')).toBeInTheDocument()
  })

  it('explains when a version is retained by the current lifecycle policy', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: () => Response.json(VERSIONS),
    })

    renderHistory()
    await userEvent.click(await screen.findByRole('button', { name: /Actions for version/ }))

    expect(await screen.findByText('Not currently scheduled to expire')).toBeInTheDocument()
  })

  it('explains that a version beyond the keep limit must reach the count rule age minimum', async () => {
    const archivedAt = new Date().toISOString()
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: () =>
        Response.json([
          VERSIONS[0],
          { ...VERSIONS[1], archived_at: archivedAt },
          { ...VERSIONS[1], version: 'v-oldest', archived_at: archivedAt },
        ]),
    })

    renderHistory({
      lifecyclePolicy: { expiryDays: 30, maxVersions: 1 },
      expirationMode: 'or',
    })

    const countdown = await screen.findByText('1d')
    await userEvent.hover(countdown)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'beyond the limit of 1 kept version and becomes eligible to expire in 1 day'
    )
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
  })
})
