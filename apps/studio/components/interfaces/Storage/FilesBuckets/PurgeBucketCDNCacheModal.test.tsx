import { faker } from '@faker-js/faker'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { useState } from 'react'
import { toast, Toaster } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PurgeBucketCDNCacheModal } from './PurgeBucketCDNCacheModal'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { Bucket } from '@/data/storage/buckets-query'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { createMockAuthContext } from '@/tests/lib/auth-helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { routerMock } from '@/tests/lib/route-mock'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']

const PROFILE_CONTEXT = createMockProfileContext()
const AUTH_CONTEXT = createMockAuthContext()

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
      <Toaster />
    </ProjectContextProvider>
  )
}

describe('PurgeBucketCDNCacheModal', () => {
  beforeEach(() => {
    toast.dismiss()
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
  })

  const mockOrganization = (plan: OrganizationResponse['plan']) =>
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: [createMockOrganizationResponse({ id: 1, slug: 'org-a', plan })],
    })

  it('purges and closes the dialog for users on paid plans', async () => {
    mockOrganization({ id: 'pro', name: 'Pro' })
    let purgeRequest: unknown
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/cdn/purge-bucket',
      response: async ({ request }) => {
        purgeRequest = await request.json()
        return HttpResponse.json({ ok: true })
      },
    })
    const onClose = vi.fn()
    customRender(<Page onClose={onClose} />, {
      profileContext: PROFILE_CONTEXT,
      authContext: AUTH_CONTEXT,
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Open' }))
    await screen.findByRole('alertdialog')
    await userEvent.click(await screen.findByRole('button', { name: 'Purge CDN cache' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    await screen.findByText('Successfully purged CDN cache for bucket “test”')
    expect(purgeRequest).toEqual({ bucket_id: 'test' })
  })

  it('keeps the dialog open and shows the error when the purge fails', async () => {
    mockOrganization({ id: 'pro', name: 'Pro' })
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/cdn/purge-bucket',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })
    const onClose = vi.fn()
    customRender(<Page onClose={onClose} />, {
      profileContext: PROFILE_CONTEXT,
      authContext: AUTH_CONTEXT,
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Open' }))
    await screen.findByRole('alertdialog')
    await userEvent.click(await screen.findByRole('button', { name: 'Purge CDN cache' }))

    await screen.findByText('Failed to purge CDN cache for bucket “test”: Boom')
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  // Covers the shared PurgeCDNCacheDialog's free-plan branch, used by both purge modals
  it('asks users on the free plan to upgrade instead of offering the purge', async () => {
    // Feature detection used in UpgradePlanButton
    addAPIMock({
      method: 'get',
      // @ts-expect-error
      path: '/enabled-features-overrides',
      response: {
        // @ts-expect-error
        billingAll: true,
      },
    })
    mockOrganization({ id: 'free', name: 'Free' })
    customRender(<Page onClose={vi.fn()} />, {
      profileContext: PROFILE_CONTEXT,
      authContext: AUTH_CONTEXT,
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Open' }))
    await screen.findByRole('alertdialog')

    await screen.findByRole('link', { name: 'Upgrade to Pro' })
    expect(screen.queryByRole('button', { name: 'Purge CDN cache' })).not.toBeInTheDocument()
  })
})
