import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ArchivedFilePreviewPane } from '@/components/interfaces/Storage/StorageExplorer/ArchivedFilePreviewPane'
import type { ArchivedVersionRow } from '@/components/interfaces/Storage/StorageExplorer/archivedVersions.utils'
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
    mimeType: 'image/png',
  },
  noncurrentVersions: [
    {
      versionId: 'v-older',
      size: 80,
      createdAt: '2023-12-01T00:00:00Z',
      action: 'initial upload',
      mimeType: 'image/png',
    },
  ],
}

let selectedArchivedVersion: ArchivedVersionRow | undefined

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
    selectedArchivedVersion,
    setSelectedArchivedVersion: vi.fn(),
    clearArchivedSelection,
  }),
}))
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))

describe('ArchivedFilePreviewPane', () => {
  // The pane previews the archived file, so every test makes this request.
  let signed: unknown[] = []
  beforeEach(() => {
    signed = []
    selectedArchivedVersion = undefined
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/sign',
      response: async ({ request }) => {
        signed.push(await request.json())
        return Response.json({ signedUrl: 'https://example.com/gone.png' })
      },
    })
  })

  it('signs the archived version, since the path itself resolves to the delete marker', async () => {
    render(<ArchivedFilePreviewPane />)

    await waitFor(() =>
      expect(signed).toContainEqual(
        expect.objectContaining({
          path: 'images/gone.png',
          options: expect.objectContaining({ versionId: 'v-current' }),
        })
      )
    )
  })

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

  it('promotes the selected version after unarchiving, not just the one under the marker', async () => {
    selectedArchivedVersion = {
      versionId: 'v-older',
      size: 80,
      createdAt: '2023-12-01T00:00:00Z',
      action: 'initial upload',
      mimeType: 'image/png',
      wasCurrentAtArchive: false,
    }

    const unarchived: unknown[] = []
    const moved: unknown[] = []
    addAPIMock({
      method: 'delete',
      path: '/platform/storage/:ref/buckets/:id/objects',
      response: async ({ request }) => {
        unarchived.push(await request.json())
        return Response.json({})
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/move',
      response: async ({ request }) => {
        moved.push(await request.json())
        return Response.json({})
      },
    })

    render(<ArchivedFilePreviewPane />)

    await userEvent.click(screen.getByRole('button', { name: /restore as current version/i }))

    // Removing the delete marker only promotes the version that was current at archive time.
    await waitFor(() => expect(unarchived).toHaveLength(1))
    await waitFor(() => expect(moved).toHaveLength(1))
    expect(moved[0]).toMatchObject({
      from: 'images/gone.png',
      to: 'images/gone.png',
      sourceVersionId: 'v-older',
    })
    expect(clearArchivedSelection).toHaveBeenCalled()
  })
})
