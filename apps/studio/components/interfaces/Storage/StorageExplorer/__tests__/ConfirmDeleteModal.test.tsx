import { describe, expect, it, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { addAPIMock } from 'tests/lib/msw'
import ConfirmDeleteModal from '../ConfirmDeleteModal'
import { render } from 'tests/helpers'
import { routerMock } from 'tests/lib/route-mock'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { faker } from '@faker-js/faker'
import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../../Storage.constants'
import { Button } from 'ui'
import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'

const Page = ({ onClose }: { onClose?: () => void }) => {
  const { setSelectedItemsToDelete, setSelectedBucket } = useStorageExplorerStateSnapshot()

  const handleOpen = () => {
    setSelectedBucket({
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
    })
    setSelectedItemsToDelete([
      {
        id: faker.string.uuid(),
        name: faker.word.noun(),
        columnIndex: 0,
        isCorrupted: false,
        metadata: null,
        status: STORAGE_ROW_STATUS.READY,
        type: STORAGE_ROW_TYPES.FILE,
        created_at: faker.date.recent().toISOString(),
        updated_at: faker.date.recent().toISOString(),
        last_accessed_at: null,
      },
    ])
  }

  return (
    <>
      <Button onClick={handleOpen}>Open</Button>
      <ConfirmDeleteModal onClose={onClose} />
    </>
  )
}

describe(`ConfirmDeleteModal`, () => {
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
    addAPIMock({
      method: `delete`,
      path: `/platform/storage/:ref/buckets/:id/objects`,
    })
    // Called by useStorageExplorerStateSnapshot but seems
    // to be unnecessary for succesful test?
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
    render(
      <ProjectContextProvider projectRef="default">
        <Page onClose={onClose} />
      </ProjectContextProvider>
    )

    const openButton = screen.getByRole(`button`, { name: `Open` })
    await userEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole(`button`, { name: `Confirm` })

    fireEvent.click(confirmButton)

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
