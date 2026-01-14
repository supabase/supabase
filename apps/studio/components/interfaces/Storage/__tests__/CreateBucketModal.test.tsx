import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { customRender } from 'tests/lib/custom-render'
import { addAPIMock } from 'tests/lib/msw'
import { routerMock } from 'tests/lib/route-mock'
import { CreateBucketModal } from '../CreateBucketModal'

describe(`CreateBucketModal`, () => {
  beforeEach(() => {
    vi.mock(`hooks/misc/useCheckPermissions`, () => ({
      useCheckPermissions: vi.fn(),
      useAsyncCheckPermissions: vi.fn().mockImplementation(() => ({ can: true })),
    }))
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
})
