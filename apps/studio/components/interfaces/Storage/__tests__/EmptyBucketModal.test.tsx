import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { screen, waitFor, fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Trash, MoreVertical } from 'lucide-react'
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
import EmptyBucketModal from '../EmptyBucketModal'
import { render } from 'tests/helpers'
import { routerMock } from 'tests/lib/route-mock'

const bucket: Bucket = {
  id: faker.string.uuid(),
  name: `test`,
  owner: faker.string.uuid(),
  public: faker.datatype.boolean(),
  allowed_mime_types: faker.helpers.multiple(() => faker.system.mimeType(), {
    count: { min: 1, max: 5 },
  }),
  file_size_limit: faker.number.int({ min: 0, max: 25165824 }),
  type: faker.helpers.arrayElement(['STANDARD', 'ANALYTICS', undefined]),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
}

const Page = ({ onClose }: { onClose: () => void }) => {
  const [modal, setModal] = useState<string | null>(null)
  const renderModal = () => {
    switch (modal) {
      case `empty`:
        return (
          <EmptyBucketModal
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
          <Button title="Manage Bucket" type="text" className="px-1" icon={<MoreVertical />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-32">
          <DropdownMenuItem className="space-x-2" onClick={() => setModal(`empty`)}>
            <Trash stroke="red" size="14" />
            <p className="text-foreground-light">Empty</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {renderModal()}
    </ProjectContextProvider>
  )
}

mockAnimationsApi()

describe(`EmptyBucketModal`, () => {
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
    // useBucketEmptyMutation
    addAPIMock({
      method: `post`,
      path: `/platform/storage/:ref/buckets/:id/empty`,
    })
    // Called but seems to be unnecessary for succesful test?
    // useProjectSettingsV2Query -> ProjectSettings
    // GET /platform/projects/:ref/settings
    // useAPIKeysQuery -> APIKey[]
    // GET /v1/projects/:ref/api-keys
    // listBucketObjects -> ListBucketObjectsData
    // POST /platform/storage/:ref/buckets/:id/objects/list
  })

  it(`renders a confirmation dialog`, async () => {
    const onClose = vi.fn()
    render(<Page onClose={onClose} />)

    const menuTrigger = screen.getByRole(`button`, { name: `Manage Bucket` })
    await userEvent.click(menuTrigger)
    const deleteOption = await screen.findByRole(`menuitem`, { name: `Empty` })
    await userEvent.click(deleteOption)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole(`button`, { name: `Empty Bucket` })

    fireEvent.click(confirmButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
