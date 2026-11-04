import { faker } from '@faker-js/faker'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { useState } from 'react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PurgeBucketCDNCacheModal } from './PurgeBucketCDNCacheModal'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { Bucket } from '@/data/storage/buckets-query'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { routerMock } from '@/tests/lib/route-mock'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']

const PROFILE_CONTEXT = createMockProfileContext()

const { mockUseSelectedOrganizationQuery } = vi.hoisted(() => ({
  mockUseSelectedOrganizationQuery: vi.fn(),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: mockUseSelectedOrganizationQuery,
}))

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
      <button tabIndex={0} onClick={() => setOpen(true)}>
        Open
      </button>

      <PurgeBucketCDNCacheModal
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

describe('PurgeBucketCDNCacheModal', () => {
  beforeEach(() => {
    // useParams
    routerMock.setCurrentUrl('/project/default/storage/files/buckets/test')
    // useProjectContext
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
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
    // useBucketPurgeCDNCacheMutation
    addAPIMock({
      method: 'get',
      path: '/enabled-features-overrides',
      response: {
        // @ts-expect-error
        billingAll: true,
      },
    })
    // useBucketPurgeCDNCacheMutation
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/cdn/purge-bucket',
      response: {
        // @ts-expect-error
        ok: true,
      },
    })
  })

  it.each([
    { id: 'pro', name: 'Pro' },
    { id: 'team', name: 'Team' },
    { id: 'enterprise', name: 'Enterprise' },
    { id: 'platform', name: 'Platform' },
  ] as Array<OrganizationResponse['plan']>)(
    'renders a confirmation dialog for users on $name plans',
    async ({ id, name }) => {
      mockUseSelectedOrganizationQuery.mockReturnValue({
        data: createMockOrganizationResponse({ slug: 'org-a', plan: { id, name } }),
        isSuccess: true,
      })
      const onClose = vi.fn()
      customRender(<Page onClose={onClose} />, { profileContext: PROFILE_CONTEXT })

      await userEvent.click(await screen.findByRole('button', { name: 'Open' }))
      await screen.findByRole('alertdialog')

      await userEvent.click(await screen.findByRole('button', { name: 'Purge CDN cache' }))

      await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
      expect(toast.success).toHaveBeenCalledWith('Successfully purged CDN cache for bucket “test”')
    }
  )

  it('renders a dialog requesting users to upgrade their plan when they are on free plans', async () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganizationResponse({ slug: 'org-a', plan: { id: 'free', name: 'Free' } }),
      isSuccess: true,
    })
    const onClose = vi.fn()
    customRender(<Page onClose={onClose} />, { profileContext: PROFILE_CONTEXT })

    await userEvent.click(await screen.findByRole('button', { name: 'Open' }))
    await screen.findByRole('alertdialog')

    await screen.findByRole('link', { name: 'Upgrade to Pro' })
  })
})
