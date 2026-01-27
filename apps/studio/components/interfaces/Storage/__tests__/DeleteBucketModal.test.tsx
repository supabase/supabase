import { faker } from '@faker-js/faker'
import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { Bucket } from 'data/storage/buckets-query'
import { customRender } from 'tests/lib/custom-render'
import { addAPIMock } from 'tests/lib/msw'
import { routerMock } from 'tests/lib/route-mock'
import { DeleteBucketModal } from '../DeleteBucketModal'

const bucket: Bucket = {
  id: 'test',
  name: 'test',
  owner: faker.string.uuid(),
  public: faker.datatype.boolean(),
  allowed_mime_types: faker.helpers.multiple(() => faker.system.mimeType(), {
    count: { min: 1, max: 5 },
  }),
  file_size_limit: faker.number.int({ min: 0, max: 25165824 }),
  type: 'STANDARD',
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
}

const Page = ({ onClose }: { onClose: () => void }) => {
  const [open, setOpen] = useState(false)
  return (
    <ProjectContextProvider projectRef="default">
      <button onClick={() => setOpen(true)}>Open</button>

      <DeleteBucketModal
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

describe(`DeleteBucketModal`, () => {
  beforeEach(() => {
    // useParams
    routerMock.setCurrentUrl(`/project/default/storage/files`)
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
    // usePaginatedBucketsQuery
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
    // useBucketDeleteMutation - empty bucket
    addAPIMock({
      method: `post`,
      path: `/platform/storage/:ref/buckets/:id/empty`,
    })
    // useBucketDeleteMutation - poll for empty bucket
    addAPIMock({
      method: `post`,
      path: `/platform/storage/:ref/buckets/:id/objects/list`,
      response: [], // Return empty array to indicate bucket is empty
    })
    // useBucketDeleteMutation - delete bucket
    addAPIMock({
      method: `delete`,
      path: `/platform/storage/:ref/buckets/:id`,
    })
  })

  it(`renders a confirmation dialog`, async () => {
    const onClose = vi.fn()
    customRender(<Page onClose={onClose} />)

    const openButton = screen.getByRole(`button`, { name: `Open` })
    await userEvent.click(openButton)
    await screen.findByRole(`dialog`)

    const input = screen.getByPlaceholderText(`Type bucket name`)
    await userEvent.type(input, `test`)

    const confirmButton = screen.getByRole(`button`, { name: `Delete bucket` })
    fireEvent.click(confirmButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(routerMock.asPath).toStrictEqual(`/project/default/storage/files`)
  })
})
