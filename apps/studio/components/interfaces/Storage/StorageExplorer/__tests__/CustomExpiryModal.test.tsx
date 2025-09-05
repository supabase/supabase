import { describe, expect, it, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { addAPIMock } from 'tests/lib/msw'
import CustomExpiryModal from '../CustomExpiryModal'
import { render } from 'tests/helpers'
import { routerMock } from 'tests/lib/route-mock'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { faker } from '@faker-js/faker'
import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../../Storage.constants'
import { ProjectContextProvider } from 'components/layouts/ProjectLayout/ProjectContext'

const Page = () => {
  const { setSelectedFileCustomExpiry, setSelectedBucket } = useStorageExplorerStateSnapshot()

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
      type: 'STANDARD',
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
    })
    setSelectedFileCustomExpiry({
      id: faker.string.uuid(),
      name: faker.word.noun(),
      isCorrupted: false,
      metadata: null,
      status: STORAGE_ROW_STATUS.READY,
      type: STORAGE_ROW_TYPES.FILE,
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      last_accessed_at: null,
    })
  }

  return (
    <>
      <button onClick={handleOpen}>Open</button>
      <CustomExpiryModal />
    </>
  )
}

describe(`CustomExpiryModal`, () => {
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
    addAPIMock({
      method: `post`,
      path: `/platform/storage/:ref/buckets/:id/objects/public-url`,
      response: {
        publicUrl: faker.internet.url(),
      },
    })
    addAPIMock({
      method: `post`,
      path: `/platform/storage/:ref/buckets/:id/objects/sign`,
      response: {
        signedUrl: faker.internet.url(),
      },
    })
  })

  it(`renders a confirmation dialog`, async () => {
    render(
      <ProjectContextProvider projectRef="default">
        <Page />
      </ProjectContextProvider>
    )

    const openButton = screen.getByRole(`button`, { name: `Open` })
    await userEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByRole(`dialog`)).toBeInTheDocument()
    })

    const durationInput = screen.getByLabelText(`Duration`)
    await userEvent.type(durationInput, `2`)
    const unitSelect = screen.getByLabelText(`Duration units`)
    expect(unitSelect).toHaveTextContent(`days`)
    await userEvent.click(unitSelect)
    const weeksOption = screen.getByRole(`option`, { name: `weeks` })
    await userEvent.click(weeksOption)
    expect(unitSelect).toHaveTextContent(`weeks`)

    const confirmButton = screen.getByRole(`button`, { name: `Get signed URL` })

    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.queryByRole(`dialog`)).not.toBeInTheDocument()
    })
  })
})
