import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateBucketModal } from './CreateBucketModal'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

vi.mock('@/hooks/misc/useCheckPermissionsV2', () => ({
  useAsyncCheckPermissionsV2: () => ({ can: true }),
  FGA_PERMISSIONS: {
    PROJECT: {
      STORAGE_WRITE: 'storage_write',
    },
  },
}))

const { versioningEnabled } = vi.hoisted(() => ({ versioningEnabled: { current: false } }))

vi.mock(
  '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext',
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, useIsStorageVersioningEnabled: () => versioningEnabled.current }
  }
)

describe(`CreateBucketModal`, () => {
  beforeEach(() => {
    versioningEnabled.current = false
    // useParams
    routerMock.setCurrentUrl(`/project/default/storage/buckets`)
    // useSelectedProject -> Project
    addAPIMock({
      method: `get`,
      path: `/platform/projects/:ref`,
      // @ts-expect-error
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })
    // useBucketCreateMutation
    addAPIMock({
      method: `post`,
      path: `/platform/storage/:ref/buckets`,
    })
  })

  it('submits the public flag, size limit and MIME types entered in the form', async () => {
    const requests: unknown[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets',
      response: async ({ request }) => {
        requests.push(await request.json())
        return Response.json({ name: 'test' })
      },
    })
    const onOpenChange = vi.fn()

    customRender(
      <ProjectContextProvider projectRef="default">
        <CreateBucketModal open onOpenChange={onOpenChange} />
      </ProjectContextProvider>
    )

    await userEvent.type(await screen.findByLabelText('Bucket name'), 'test')
    await userEvent.click(screen.getByLabelText('Public bucket'))
    await userEvent.click(screen.getByLabelText('Restrict file size'))
    await userEvent.type(screen.getByLabelText('File size limit'), '25')

    const sizeLimitUnitSelect = screen.getByLabelText('File size limit unit')
    expect(sizeLimitUnitSelect).toHaveTextContent('MB')
    await userEvent.click(sizeLimitUnitSelect)
    await userEvent.click(screen.getByRole('option', { name: 'bytes' }))

    await userEvent.click(screen.getByLabelText('Restrict MIME types'))
    fireEvent.change(screen.getByLabelText('Allowed MIME types'), {
      target: { value: 'image/jpeg, image/png' },
    })

    // jsdom doesn't associate the footer button with the form by attribute
    fireEvent.submit(document.getElementById('create-storage-bucket-form')!)

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(requests).toEqual([
      expect.objectContaining({
        id: 'test',
        public: true,
        file_size_limit: 25,
        allowed_mime_types: ['image/jpeg', 'image/png'],
      }),
    ])
  })

  it('keeps the bucket it created when the retention policy is rejected', async () => {
    versioningEnabled.current = true
    const postBucket = vi.fn(() => Response.json({ name: 'versioned' }))
    addAPIMock({ method: 'post', path: '/platform/storage/:ref/buckets', response: postBucket })
    addAPIMock({
      method: 'put',
      path: '/platform/storage/:ref/buckets/:id/lifecycle',
      response: () => Response.json({ message: 'Lifecycle is not available' }, { status: 500 }),
    })
    const onOpenChange = vi.fn()

    customRender(
      <ProjectContextProvider projectRef="default">
        <CreateBucketModal open onOpenChange={onOpenChange} />
      </ProjectContextProvider>
    )

    await userEvent.type(await screen.findByLabelText('Bucket name'), 'versioned')
    await userEvent.click(screen.getByRole('switch', { name: 'Object versioning' }))

    // Submitted off the form itself: jsdom doesn't associate a button with a form by
    // attribute, so clicking the footer's Create submits nothing.
    fireEvent.submit(document.getElementById('create-storage-bucket-form')!)

    // The bucket exists, so the modal closes rather than inviting a retry that would
    // only collide on the name.
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(postBucket).toHaveBeenCalledTimes(1)
  })
})
