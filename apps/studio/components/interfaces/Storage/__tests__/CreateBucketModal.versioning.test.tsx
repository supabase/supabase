import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateBucketModal } from '../CreateBucketModal'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

vi.mock(`hooks/misc/useCheckPermissions`, () => ({
  useCheckPermissions: vi.fn(),
  useAsyncCheckPermissions: vi.fn().mockImplementation(() => ({ can: true })),
}))

vi.mock(
  '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext',
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, useIsStorageVersioningEnabled: () => true }
  }
)

describe('CreateBucketModal versioning', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/storage/buckets')
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error minimal project shape for useSelectedProject
      response: { id: 1, ref: 'default', name: 'Default Project', status: 'ACTIVE_HEALTHY' },
    })
  })

  it('keeps the bucket it created when the retention policy is rejected', async () => {
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
