import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateBucketModal } from './CreateBucketModal'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

vi.mock(`hooks/misc/useCheckPermissions`, () => ({
  useCheckPermissions: vi.fn(),
  useAsyncCheckPermissions: vi.fn().mockImplementation(() => ({ can: true })),
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

  it(`renders a dialog with a form`, async () => {
    customRender(
      <ProjectContextProvider projectRef="default">
        <CreateBucketModal open={true} onOpenChange={() => {}} />
      </ProjectContextProvider>,
      {
        nuqs: {
          searchParams: {
            new: 'true',
          },
        },
      }
    )

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(`Bucket name`)
    await userEvent.type(nameInput, `test`)

    const publicToggle = screen.getByLabelText(`Public bucket`)
    expect(publicToggle).not.toBeChecked()
    await userEvent.click(publicToggle)
    expect(publicToggle).toBeChecked()

    const sizeLimitToggle = screen.getByLabelText(`Restrict file size`)
    expect(sizeLimitToggle).not.toBeChecked()
    await userEvent.click(sizeLimitToggle)
    expect(sizeLimitToggle).toBeChecked()

    const sizeLimitInput = screen.getByLabelText(`File size limit`)
    expect(sizeLimitInput).toHaveValue(null)
    await userEvent.type(sizeLimitInput, `25`)

    const sizeLimitUnitSelect = screen.getByLabelText(`File size limit unit`)
    expect(sizeLimitUnitSelect).toHaveTextContent(`MB`)
    await userEvent.click(sizeLimitUnitSelect)
    const bytesOption = screen.getByRole(`option`, { name: `bytes` })
    await userEvent.click(bytesOption)
    expect(sizeLimitUnitSelect).toHaveTextContent(`bytes`)

    const mimeTypeToggle = screen.getByLabelText(`Restrict MIME types`)
    expect(mimeTypeToggle).not.toBeChecked()
    await userEvent.click(mimeTypeToggle)
    expect(mimeTypeToggle).toBeChecked()

    const mimeTypeInput = screen.getByLabelText(`Allowed MIME types`)
    expect(mimeTypeInput).toHaveValue(``)
    await userEvent.type(mimeTypeInput, `image/jpeg, image/png`)

    const submitButton = screen.getByRole(`button`, { name: `Create` })

    fireEvent.click(submitButton)
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
