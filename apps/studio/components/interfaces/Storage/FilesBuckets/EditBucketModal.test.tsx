import { faker } from '@faker-js/faker'
import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EditBucketModal } from './EditBucketModal'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { Bucket } from '@/data/storage/buckets-query'
import { render } from '@/tests/helpers'
import { addAPIMock } from '@/tests/lib/msw'

const { versioningEnabled } = vi.hoisted(() => ({ versioningEnabled: { current: false } }))

vi.mock(
  '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext',
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, useIsStorageVersioningEnabled: () => versioningEnabled.current }
  }
)

const bucket: Bucket = {
  id: faker.string.uuid(),
  name: `test`,
  owner: faker.string.uuid(),
  public: false,
  allowed_mime_types: [],
  file_size_limit: undefined,
  type: 'STANDARD',
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
}

const versionedBucket: Bucket = {
  id: 'my-bucket',
  name: 'my-bucket',
  owner: 'owner',
  public: false,
  allowed_mime_types: [],
  file_size_limit: undefined,
  type: 'STANDARD',
  versioning_status: 'ENABLED',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const Page = ({ onClose }: { onClose: () => void }) => {
  const [open, setOpen] = useState(false)
  return (
    <ProjectContextProvider projectRef="default">
      <button tabIndex={0} onClick={() => setOpen(true)}>
        Open
      </button>

      <EditBucketModal
        visible={open}
        bucket={bucket}
        onClose={() => {
          setOpen(false)
          onClose()
        }}
      />
    </ProjectContextProvider>
  )
}

describe(`EditBucketModal`, () => {
  beforeEach(() => {
    versioningEnabled.current = false
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
    // useBucketUpdateMutation
    addAPIMock({
      method: `patch`,
      path: `/platform/storage/:ref/buckets/:id`,
    })
  })

  it(`renders a dialog with a form`, async () => {
    const onClose = vi.fn()
    render(<Page onClose={onClose} />)

    const openButton = screen.getByRole(`button`, { name: `Open` })
    await userEvent.click(openButton)
    await screen.findByRole(`dialog`)

    const nameInput = screen.getByLabelText(`Bucket name`)
    expect(nameInput).toHaveValue(`test`)
    expect(nameInput).toBeDisabled()

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
    const mbOption = screen.getByRole(`option`, { name: `GB` })
    await userEvent.click(mbOption)
    expect(sizeLimitUnitSelect).toHaveTextContent(`GB`)

    const mimeTypeToggle = screen.getByLabelText(`Restrict MIME types`)
    expect(mimeTypeToggle).not.toBeChecked()
    await userEvent.click(mimeTypeToggle)
    expect(mimeTypeToggle).toBeChecked()

    const mimeTypeInput = screen.getByLabelText(`Allowed MIME types`)
    expect(mimeTypeInput).toHaveValue(``)
    await userEvent.type(mimeTypeInput, `image/jpeg, image/png`)

    const confirmButton = screen.getByRole(`button`, { name: `Save` })

    fireEvent.click(confirmButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  describe('versioning', () => {
    beforeEach(() => {
      versioningEnabled.current = true
    })

    it('shows the policy as loading rather than absent, and holds the save', async () => {
      // Never resolves, so the modal stays in the window the user sees on open.
      addAPIMock({
        method: 'get',
        path: '/platform/storage/:ref/buckets/:id/lifecycle',
        response: () => new Promise(() => {}) as unknown as Response,
      })

      render(
        <ProjectContextProvider projectRef="default">
          <EditBucketModal visible bucket={versionedBucket} onClose={vi.fn()} />
        </ProjectContextProvider>
      )

      expect(await screen.findByLabelText('Loading lifecycle policy')).toBeInTheDocument()
      expect(screen.queryByText('No lifecycle policy')).not.toBeInTheDocument()
      // Submitting now would persist the empty policy the form is still seeded with.
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('reports no policy once the bucket is known to have none', async () => {
      addAPIMock({
        method: 'get',
        path: '/platform/storage/:ref/buckets/:id/lifecycle',
        response: () => Response.json({ rules: [] }),
      })

      render(
        <ProjectContextProvider projectRef="default">
          <EditBucketModal visible bucket={versionedBucket} onClose={vi.fn()} />
        </ProjectContextProvider>
      )

      expect(await screen.findByText('No lifecycle policy')).toBeInTheDocument()
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled())
    })

    it('surfaces a failed policy fetch and holds the save', async () => {
      addAPIMock({
        method: 'get',
        path: '/platform/storage/:ref/buckets/:id/lifecycle',
        response: () =>
          Response.json({ message: 'Bucket lifecycle is unavailable' }, { status: 500 }),
      })

      render(
        <ProjectContextProvider projectRef="default">
          <EditBucketModal visible bucket={versionedBucket} onClose={vi.fn()} />
        </ProjectContextProvider>
      )

      expect(await screen.findByText('Failed to retrieve the lifecycle policy')).toBeInTheDocument()
      // A 404 is the "no policy" answer; anything else leaves the real policy unknown.
      expect(screen.queryByText('No lifecycle policy')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('leaves a policy it cannot model alone when versioning is switched on', async () => {
      // Two age rules: the form reads the first and has nowhere to put the second, and the
      // update endpoint replaces the whole policy, so writing the form's defaults loses it.
      addAPIMock({
        method: 'get',
        path: '/platform/storage/:ref/buckets/:id/lifecycle',
        response: () =>
          Response.json({
            rules: [30, 60].map((noncurrent_days) => ({
              status: 'Enabled',
              filter: {},
              noncurrent_version_expiration: { noncurrent_days },
            })),
          }),
      })
      const putLifecycle = vi.fn(() => Response.json({ rules: [] }))
      addAPIMock({
        method: 'put',
        path: '/platform/storage/:ref/buckets/:id/lifecycle',
        response: putLifecycle,
      })
      const patchBucket = vi.fn(() => Response.json({ message: 'Successfully updated bucket' }))
      addAPIMock({
        method: 'patch',
        path: '/platform/storage/:ref/buckets/:id',
        response: patchBucket,
      })

      render(
        <ProjectContextProvider projectRef="default">
          <EditBucketModal
            visible
            bucket={{ ...versionedBucket, versioning_status: 'DISABLED' }}
            onClose={vi.fn()}
          />
        </ProjectContextProvider>
      )

      await userEvent.click(await screen.findByRole('switch', { name: 'Object versioning' }))

      expect(
        await screen.findByText('Lifecycle policy set outside the dashboard')
      ).toBeInTheDocument()

      // Saved off the form itself: jsdom doesn't associate a button with a form by attribute,
      // so clicking the footer's Save submits nothing.
      fireEvent.submit(document.getElementById('edit-storage-bucket-form')!)

      await waitFor(() => expect(patchBucket).toHaveBeenCalled())
      expect(putLifecycle).not.toHaveBeenCalled()
    })
  })
})
