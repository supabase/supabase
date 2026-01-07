import { faker } from '@faker-js/faker'
import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { Bucket } from 'data/storage/buckets-query'
import { render } from 'tests/helpers'
import { addAPIMock } from 'tests/lib/msw'
import { routerMock } from 'tests/lib/route-mock'
import { EmptyBucketModal } from '../EmptyBucketModal'

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
  const [open, setOpen] = useState(false)
  return (
    <ProjectContextProvider projectRef="default">
      <button onClick={() => setOpen(true)}>Open</button>

      <EmptyBucketModal
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
    // Called by useStorageExplorerStateSnapshot but seems
    // to be unnecessary for successful test?
    //
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

    const openButton = screen.getByRole(`button`, { name: `Open` })
    await userEvent.click(openButton)
    await screen.findByRole(`dialog`)

    const confirmButton = screen.getByRole(`button`, { name: `Empty bucket` })

    fireEvent.click(confirmButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
