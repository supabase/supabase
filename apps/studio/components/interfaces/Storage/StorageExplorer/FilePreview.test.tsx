import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FilePreview } from '@/components/interfaces/Storage/StorageExplorer/FilePreview'
import { storageKeys } from '@/data/storage/keys'
import { customRender as render } from '@/tests/lib/custom-render'
import { mockStorageSigning } from '@/tests/lib/storage-client-mocks'

const SIGNED_URL = '/storage/v1/object/sign/my-bucket/photo.png?token=abc'

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => ({
    projectRef: 'abcdef',
    selectedBucket: { id: 'my-bucket', name: 'my-bucket', public: false },
  }),
}))

const mockSignEndpoint = () => mockStorageSigning()

describe('FilePreview', () => {
  it('asks for the specific version it was given', async () => {
    const bodies = mockSignEndpoint()

    render(
      <FilePreview path="folder/photo.png" mimeType="image/png" size={100} versionId="v-older" />
    )

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({
      versionId: 'v-older',
    })
  })

  it('omits the version entirely when previewing the current one', async () => {
    const bodies = mockSignEndpoint()

    render(<FilePreview path="folder/photo.png" mimeType="image/png" size={100} />)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).not.toHaveProperty('versionId')
  })

  it('renders the resolved URL rather than a placeholder for an image', async () => {
    mockSignEndpoint()

    const { container } = render(
      <FilePreview path="photo.png" mimeType="image/png" size={100} versionId="v-older" />
    )

    await waitFor(() =>
      expect(container.querySelector(`[style*="${SIGNED_URL}"]`)).toBeInTheDocument()
    )
  })

  it('keys each version separately, so a new one cannot reuse the cached URL', () => {
    const current = storageKeys.fileUrl({
      projectRef: 'abcdef',
      isBucketPublic: false,
      bucketId: 'my-bucket',
      path: 'photo.png',
    })

    expect(
      storageKeys.fileUrl({
        projectRef: 'abcdef',
        isBucketPublic: false,
        bucketId: 'my-bucket',
        path: 'photo.png',
        versionId: 'v-new',
      })
    ).not.toEqual(current)

    // The version-less key is a prefix of every version's, so one invalidation clears all.
    expect(
      storageKeys
        .fileUrl({
          projectRef: 'abcdef',
          isBucketPublic: false,
          bucketId: 'my-bucket',
          path: 'photo.png',
          versionId: 'v-new',
        })
        .slice(0, current.length)
    ).toEqual(current)
  })

  it('skips the request for a file too large to preview', async () => {
    const bodies = mockSignEndpoint()

    render(
      <FilePreview
        path="huge.png"
        mimeType="image/png"
        size={50 * 1024 * 1024}
        versionId="v-older"
      />
    )

    expect(await screen.findByText(/too large to preview/i)).toBeInTheDocument()
    expect(bodies).toHaveLength(0)
  })
})
