import { describe, expect, it, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { addAPIMock } from 'tests/lib/msw'
import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'

import { render } from 'tests/helpers'
import { routerMock } from 'tests/lib/route-mock'
import CreateBucketModal from '../CreateBucketModal'

describe(`CreateBucketModal`, () => {
  beforeEach(() => {
    vi.mock(`hooks/misc/useCheckPermissions`, () => ({
      useCheckPermissions: vi.fn(),
      useAsyncCheckProjectPermissions: vi.fn().mockImplementation(() => ({ can: true })),
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
    render(
      <ProjectContextProvider projectRef="default">
        <CreateBucketModal />
      </ProjectContextProvider>
    )

    const dialogTrigger = screen.getByRole(`button`, { name: `New bucket` })
    await userEvent.click(dialogTrigger)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(`Name of bucket`)
    await userEvent.type(nameInput, `test`)

    const standardOption = screen.getByLabelText(`Standard bucket`)
    await userEvent.click(standardOption)

    const publicToggle = screen.getByLabelText(`Public bucket`)
    expect(publicToggle).not.toBeChecked()
    await userEvent.click(publicToggle)
    expect(publicToggle).toBeChecked()

    const detailsTrigger = screen.getByRole(`button`, { name: `Additional configuration` })
    expect(detailsTrigger).toHaveAttribute(`data-state`, `closed`)
    await userEvent.click(detailsTrigger)
    expect(detailsTrigger).toHaveAttribute(`data-state`, `open`)

    const sizeLimitToggle = screen.getByLabelText(`Restrict file upload size for bucket`)
    expect(sizeLimitToggle).not.toBeChecked()
    await userEvent.click(sizeLimitToggle)
    expect(sizeLimitToggle).toBeChecked()

    const sizeLimitInput = screen.getByLabelText(`File size limit`)
    expect(sizeLimitInput).toHaveValue(0)
    await userEvent.type(sizeLimitInput, `25`)

    const sizeLimitUnitSelect = screen.getByLabelText(`File size limit unit`)
    expect(sizeLimitUnitSelect).toHaveTextContent(`bytes`)
    await userEvent.click(sizeLimitUnitSelect)
    const mbOption = screen.getByRole(`option`, { name: `MB` })
    await userEvent.click(mbOption)
    expect(sizeLimitUnitSelect).toHaveTextContent(`MB`)

    const mimeTypeInput = screen.getByLabelText(`Allowed MIME types`)
    expect(mimeTypeInput).toHaveValue(``)
    await userEvent.type(mimeTypeInput, `image/jpeg, image/png`)

    const submitButton = screen.getByRole(`button`, { name: `Create` })

    fireEvent.click(submitButton)

    await waitFor(() =>
      expect(routerMock.asPath).toStrictEqual(`/project/default/storage/buckets/test`)
    )
  })
})
