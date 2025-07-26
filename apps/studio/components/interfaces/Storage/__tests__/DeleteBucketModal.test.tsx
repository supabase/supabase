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
import DeleteBucketModal from '../DeleteBucketModal'
import { customRender } from 'tests/lib/custom-render'
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
      case `delete`:
        return (
          <DeleteBucketModal
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
          <DropdownMenuItem className="space-x-2" onClick={() => setModal(`delete`)}>
            <Trash stroke="red" size="14" />
            <p className="text-foreground-light">Delete</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {renderModal()}
    </ProjectContextProvider>
  )
}

mockAnimationsApi()

describe(`DeleteBucketModal`, () => {
  beforeEach(() => {
    // useParams
    routerMock.setCurrentUrl(`/project/default/storage/buckets/test`)
    // useProjectContext
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
    // useBucketsQuery
    addAPIMock({
      method: `get`,
      path: `/platform/storage/:ref/buckets`,
      response: [bucket],
    })
    // useDatabasePoliciesQuery
    addAPIMock({
      method: `get`,
      path: `/platform/pg-meta/:ref/policies`,
      response: [
        {
          id: faker.number.int({ min: 1 }),
          name: faker.word.noun(),
          action: faker.helpers.arrayElement(['PERMISSIVE', 'RESTRICTIVE']),
          command: faker.helpers.arrayElement(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL']),
          table: faker.word.noun(),
          table_id: faker.number.int({ min: 1 }),
          check: null,
          definition: null,
          schema: faker.lorem.sentence(),
          roles: faker.helpers.multiple(() => faker.word.noun(), {
            count: { min: 1, max: 5 },
          }),
        },
      ],
    })
    // useBucketDeleteMutation
    addAPIMock({
      method: `post`,
      path: `/platform/storage/:ref/buckets/:id/empty`,
    })
    // useDatabasePolicyDeleteMutation
    addAPIMock({
      method: `delete`,
      path: `/platform/storage/:ref/buckets/:id`,
    })
  })

  it(`renders a confirmation dialog`, async () => {
    const onClose = vi.fn()
    customRender(<Page onClose={onClose} />, {
      nuqs: {
        searchParams: {
          s: 'test-search-box-value',
        },
      },
    })

    const menuTrigger = screen.getByRole(`button`, { name: `Manage Bucket` })
    await userEvent.click(menuTrigger)
    const deleteOption = await screen.findByRole(`menuitem`, { name: `Delete` })
    await userEvent.click(deleteOption)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole(`button`, { name: `Delete Bucket` })
    expect(confirmButton).toBeDisabled()

    const input = screen.getByLabelText(/Type/)
    await userEvent.type(input, `test`)
    expect(confirmButton).not.toBeDisabled()

    fireEvent.click(confirmButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(routerMock.asPath).toStrictEqual(`/project/default/storage/buckets`)
  })
})
