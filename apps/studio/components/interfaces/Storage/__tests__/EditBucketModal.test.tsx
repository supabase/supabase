import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { screen, waitFor, fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { faker } from '@faker-js/faker'

import { addAPIMock } from 'tests/lib/msw'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { Bucket } from 'data/storage/buckets-query'
import { render } from 'tests/helpers'
import { routerMock } from 'tests/lib/route-mock'
import EditBucketModal from '../EditBucketModal'

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
  const [modal, setModal] = useState<string | null>(null)
  const renderModal = () => {
    switch (modal) {
      case `edit`:
        return (
          <EditBucketModal
            bucket={bucket}
            onClose={() => {
              setModal(null)
              onClose()
            }}
          />
        )
      default:
        return null
    }
  }
  return (
    <ProjectContextProvider projectRef="default">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button title="Manage Bucket" type="text" icon={<MoreVertical />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setModal(`edit`)}>Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {renderModal()}
    </ProjectContextProvider>
  )
}

mockAnimationsApi()

describe(`EditBucketModal`, () => {
  beforeEach(() => {
    // useParams
    routerMock.setCurrentUrl(`/project/default/storage/buckets/test`)
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

    const menuTrigger = screen.getByRole(`button`, { name: `Manage Bucket` })
    await userEvent.click(menuTrigger)
    const deleteOption = await screen.findByRole(`menuitem`, { name: `Edit` })
    await userEvent.click(deleteOption)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(`Name of bucket`)
    expect(nameInput).toHaveValue(`test`)
    expect(nameInput).toBeDisabled()

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

    const confirmButton = screen.getByRole(`button`, { name: `Save` })

    fireEvent.click(confirmButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
