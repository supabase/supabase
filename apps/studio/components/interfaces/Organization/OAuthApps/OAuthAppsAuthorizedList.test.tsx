import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
import merge from 'lodash/merge'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { PartialDeep } from 'type-fest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OAuthAppsAuthorizedList } from '@/components/interfaces/Organization/OAuthApps/OAuthAppsAuthorizedList'
import { OAuthApproval, OAuthApprovalsData } from '@/data/oauth-apps/oauth-apps-approvals-query'
import {
  OAuthAppMemberGrant,
  OAuthAppMemberGrantsData,
} from '@/data/oauth-apps/oauth-apps-member-grants-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return { ...actual, useParams: () => ({ slug: 'northwind-traders' }) }
})

let canRevoke = true

mockIntersectionObserver()

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: (action: string) => ({
    can: action === 'write:Delete' ? canRevoke : true,
    isSuccess: true,
    isLoading: false,
  }),
}))

const rowFor = async (name: string) => {
  const cell = await screen.findByText(name)
  const row = cell.closest('tr')
  if (!row) throw new Error(`No row for ${name}`)
  return row
}

const openRowMenu = async (name: string) => {
  const row = await rowFor(name)
  await userEvent.click(within(row).getByRole('button'))
}

beforeEach(() => {
  canRevoke = true
  vi.clearAllMocks()
})

const createMockApproval = (data: PartialDeep<OAuthApproval> = {}): OAuthApproval =>
  merge(
    {
      id: 'approval_id',
      type: 'oauth_app',
      attributes: {
        app: { name: 'Vercel', icon: null, created_by: null },
        last_approved_at: '',
        org_grant: {
          approved_at: '',
          approved_scopes: ['database:read', 'database:write', 'projects:read'],
          grant_id: 'grant_id',
        },
        target: 'members',
      },
    },
    data
  )

const createMockApprovals = (
  approvals: OAuthApproval[] = [createMockApproval()]
): OAuthApprovalsData => ({
  data: approvals,
  links: { next: null, prev: null },
})

const createMockMemberGrant = (data: PartialDeep<OAuthAppMemberGrant> = {}): OAuthAppMemberGrant =>
  merge(
    {
      id: 'grant_id',
      type: 'oauth_grant',
      attributes: {
        approved_at: '',
        approved_scopes: ['database:read', 'database:write', 'projects:read'],
        kind: 'member_bound',
        projects: [
          { name: 'northwind-storefront', ref: 'northwindstorefront1' },
          { name: 'northwind-cms', ref: 'northwindcms1' },
        ],
        user: {
          username: 'admin-example',
          email: 'admin@example.com',
          gotrue_id: '',
        },
      },
    },
    data
  )

const createMockMemberGrants = (
  grants: OAuthAppMemberGrant[] = [createMockMemberGrant()]
): OAuthAppMemberGrantsData => ({
  data: grants,
  links: { next: null, prev: null },
})

describe('OAuthAppsAuthorizedList', () => {
  test('expands a member to show their projects and permission groups', async () => {
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals',
      method: 'get',
      response: () => HttpResponse.json<OAuthApprovalsData>(createMockApprovals()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals/:app_id/grants',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppMemberGrantsData>(createMockMemberGrants()),
    })
    customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Vercel')
    await userEvent.click(await screen.findByText('View grants'))

    expect(await screen.findByText('Member grants for Vercel')).toBeInTheDocument()
    await userEvent.click(await screen.findByText('admin@example.com'))

    expect(await screen.findByText('northwind-storefront, northwind-cms')).toBeInTheDocument()
    expect(
      await screen.findByText('database:read, database:write, projects:read')
    ).toBeInTheDocument()
  })

  test('labels an organization-bound grant and reports it as covering all projects', async () => {
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthApprovalsData>(
          createMockApprovals([
            createMockApproval({
              attributes: {
                target: 'organization',
              },
            }),
          ])
        ),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals/:app_id/grants',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppMemberGrantsData>(
          createMockMemberGrants([
            createMockMemberGrant({
              attributes: {
                kind: 'organization_bound',
                user: null,
                projects: null,
              },
            }),
          ])
        ),
    })
    customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Vercel')
    await userEvent.click(await screen.findByText('View grants'))

    expect(await screen.findByText('Organization-wide')).toBeInTheDocument()
    expect(await screen.findByText(/All projects/)).toBeInTheDocument()
  })

  test('offers Revoke to admins on an active row', async () => {
    canRevoke = true
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals',
      method: 'get',
      response: () => HttpResponse.json<OAuthApprovalsData>(createMockApprovals()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals/:app_id/grants',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppMemberGrantsData>(createMockMemberGrants()),
    })
    customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Vercel')
    expect(await screen.findByText('View grants')).toBeInTheDocument()
    expect(await screen.findByText('Revoke grants')).toBeInTheDocument()
  })

  test('does not offer Revoke to non admins on an active row', async () => {
    canRevoke = false
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals',
      method: 'get',
      response: () => HttpResponse.json<OAuthApprovalsData>(createMockApprovals()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals/:app_id/grants',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppMemberGrantsData>(createMockMemberGrants()),
    })
    customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Vercel')
    expect(await screen.findByText('View grants')).toBeInTheDocument()
    expect(screen.queryByText('Revoke grants')).not.toBeInTheDocument()
  })

  test('renders the revoke caveats and revokes on confirm', async () => {
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals',
      method: 'get',
      response: () => HttpResponse.json<OAuthApprovalsData>(createMockApprovals()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals/:app_id/grants',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppMemberGrantsData>(createMockMemberGrants()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/approvals/:app_id',
      method: 'delete',
      response: () => new HttpResponse('', { status: 200 }),
    })
    customRender(<OAuthAppsAuthorizedList />)

    await openRowMenu('Vercel')
    await userEvent.click(await screen.findByText('Revoke grants'))

    expect(await screen.findByText('Revoke access for Vercel')).toBeInTheDocument()
    expect(screen.queryByText(/organization-wide grant will be revoked/)).not.toBeInTheDocument()
    expect(
      await screen.findByText("All members lose access on the app's next request")
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Members must authorize the app again to reconnect')
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Revoked access for Vercel')
    })
  })
})
