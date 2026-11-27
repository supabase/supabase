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
  await userEvent.click(within(row).getByRole('button', { name: 'Manage app' }))
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
  test('keeps member and organization access scoped to their individual grants', async () => {
    customRender(<OAuthAppsAuthorizedList isPreview />)
    await openRowMenu('Example Members')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'View access' }))
    const sheet = await screen.findByRole('dialog')
    expect(sheet).toHaveTextContent('developer2@example.com')
    await userEvent.click(within(sheet).getByRole('button', { name: /developer@example.com/ }))
    expect(sheet).toHaveTextContent('northwind-cms')
    expect(sheet).not.toHaveTextContent('Can run SQL')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Close' }))
    await openRowMenu('Example Mixed')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'View access' }))
    const mixed = await screen.findByRole('dialog')
    expect(mixed).toHaveTextContent('example_mixed_user')
    expect(within(mixed).getByRole('heading', { name: 'Organization access' })).toBeInTheDocument()
    expect(mixed).toHaveTextContent('Run SQL on your database')
  })

  test('opens the access details for the linked app', async () => {
    const onCloseLinkedAccess = vi.fn()
    customRender(
      <OAuthAppsAuthorizedList
        isPreview
        accessApp="preview-app-2"
        onCloseLinkedAccess={onCloseLinkedAccess}
      />
    )

    const access = await screen.findByRole('dialog')
    expect(access).toHaveTextContent('Example Analytics')
    await userEvent.click(within(access).getByRole('button', { name: 'Close' }))
    expect(onCloseLinkedAccess).toHaveBeenCalledOnce()
  })

  test('previews database access and the effects of revoking without allowing a revoke', async () => {
    customRender(<OAuthAppsAuthorizedList isPreview />)

    expect(screen.getByRole('columnheader', { name: 'Permissions' })).toBeInTheDocument()
    const partner = await rowFor('Example Partner')
    expect(partner).toHaveTextContent('Database access')
    expect(partner).not.toHaveTextContent('preview-app-1')
    expect(partner).not.toHaveTextContent('northwind-cms')
    expect(await rowFor('Example Deploy')).toHaveTextContent('2 permissions')

    await openRowMenu('Example Partner')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'View access' }))
    const grants = await screen.findByRole('dialog')
    expect(grants).toHaveTextContent('preview-app-1')
    expect(grants).toHaveTextContent('example_partner_user')
    expect(grants).toHaveTextContent('wloepwuugddbnlnsakjc')
    expect(grants).toHaveTextContent('Run SQL on your database')
    expect(grants).toHaveTextContent('Read rows that your access rules normally hide')
    await userEvent.click(within(grants).getByRole('button', { name: 'Close' }))

    await openRowMenu('Example Deploy')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'View access' }))
    const deploy = await screen.findByRole('dialog')
    expect(deploy).toHaveTextContent('northwind-cms')
    expect(deploy).toHaveTextContent('Run SQL on your database')
    expect(deploy).not.toHaveTextContent('Direct database access')
    await userEvent.click(within(deploy).getByRole('button', { name: 'Close' }))

    await openRowMenu('Example Partner')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Revoke access' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Connections using')
    expect(dialog).toHaveTextContent('example_partner_user')
    expect(dialog).toHaveTextContent('all its members')
    expect(within(dialog).getByRole('button', { name: 'Revoke' })).toBeDisabled()
  })

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
    await userEvent.click(await screen.findByText('View access'))

    expect(await screen.findByText('Access for Vercel')).toBeInTheDocument()

    expect(await screen.findByText('northwind-storefront')).toBeInTheDocument()
    expect(await screen.findByText('Database management')).toBeInTheDocument()
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
    await userEvent.click(await screen.findByText('View access'))

    expect(await screen.findByText('Organization access')).toBeInTheDocument()
    expect(await screen.findByText('All current and future projects.')).toBeInTheDocument()
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
    expect(await screen.findByText('View access')).toBeInTheDocument()
    expect(await screen.findByText('Revoke access')).toBeInTheDocument()
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
    expect(await screen.findByText('View access')).toBeInTheDocument()
    expect(screen.queryByText('Revoke access')).not.toBeInTheDocument()
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
    await userEvent.click(await screen.findByText('Revoke access'))

    expect(await screen.findByRole('heading', { name: 'Revoke access' })).toBeInTheDocument()
    expect(screen.queryByText(/organization-wide grant will be revoked/)).not.toBeInTheDocument()
    expect(await screen.findByText(/members on its next request/)).toBeInTheDocument()
    expect(await screen.findByText(/will lose access for this organization/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Revoked access for Vercel')
    })
  })
})
