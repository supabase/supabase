import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FilePreview } from '@/components/interfaces/Storage/StorageExplorer/FilePreview'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const SIGNED_URL = '/storage/v1/object/sign/my-bucket/photo.png?token=abc'

vi.mock('@/state/storage-explorer', () => ({
  useStorageExplorerStateSnapshot: () => ({
    projectRef: 'abcdef',
    selectedBucket: { id: 'my-bucket', name: 'my-bucket', public: false },
  }),
}))

const mockSignEndpoint = () => {
  const bodies: Array<Record<string, unknown>> = []

  addAPIMock({
    method: 'post',
    path: '/platform/storage/:ref/buckets/:id/objects/sign',
    response: async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>)
      return Response.json({ signedUrl: SIGNED_URL })
    },
  })

  return bodies
}

describe('FilePreview', () => {
  it('asks for the specific version it was given', async () => {
    const bodies = mockSignEndpoint()

    render(
      <FilePreview path="folder/photo.png" mimeType="image/png" size={100} versionId="v-older" />
    )

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({
      path: 'folder/photo.png',
      options: { versionId: 'v-older' },
    })
  })

  it('omits the version entirely when previewing the current one', async () => {
    const bodies = mockSignEndpoint()

    render(<FilePreview path="folder/photo.png" mimeType="image/png" size={100} />)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].options).toBeUndefined()
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
