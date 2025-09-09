import { faker } from '@faker-js/faker'
import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { Bucket } from 'data/storage/buckets-query'
import { render } from 'tests/helpers'
import { addAPIMock } from 'tests/lib/msw'
import { EditBucketModal } from '../EditBucketModal'

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

const Page = ({ onClose }: { onClose: () => void }) => {
  const [open, setOpen] = useState(false)
  return (
    <ProjectContextProvider projectRef="default">
      <button onClick={() => setOpen(true)}>Open</button>

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

    const nameInput = screen.getByLabelText(`Name of bucket`)
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
})
