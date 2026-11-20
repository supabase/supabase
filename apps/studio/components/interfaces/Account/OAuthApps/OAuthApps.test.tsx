import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
import merge from 'lodash/merge'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { PartialDeep } from 'type-fest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OAuthApps } from './OAuthApps'
import { OAuthGrant, OAuthGrantsData } from '@/data/oauth-apps/oauth-apps-grants-query'
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

const createMockGrant = (data: PartialDeep<OAuthGrant> = {}): OAuthGrant =>
  merge(
    {
      id: 'approval_id',
      type: 'oauth_app',
      attributes: {
        app: { id: '', name: 'Vercel', icon: null, created_by: null },
        approved_at: new Date().toJSON(),
        approved_scopes: ['database:read', 'database:write', 'projects:read'],
        organization: {
          name: 'Northwind traders',
          slug: 'northwindtraders',
        },
        projects: [
          { name: 'northwind-storefront', ref: 'northwindstorefront1' },
          { name: 'northwind-cms', ref: 'northwindcms1' },
        ],
      },
    },
    data
  )

const createMockGrants = (approvals: OAuthGrant[] = [createMockGrant()]): OAuthGrantsData => ({
  data: approvals,
  links: { next: null, prev: null },
})

describe('OAuthApps', () => {
  test('expands a grant to show their projects and permission groups', async () => {
    addAPIMock({
      path: '/platform/profile/oauth/grants',
      method: 'get',
      response: () => HttpResponse.json<OAuthGrantsData>(createMockGrants()),
    })
    customRender(<OAuthApps />)

    await openRowMenu('Vercel')
    await userEvent.click(await screen.findByText('View projects'))

    const dialog = await screen.findByRole('dialog', { name: 'Projects using Vercel' })

    // Open the northwind-storefront accordion
    fireEvent.click(await within(dialog).findByText('northwind-storefront'))
    await within(dialog).findByText('database:read, database:write, projects:read')
    // Close the northwind-storefront accordion
    fireEvent.click(await within(dialog).findByText('northwind-storefront'))
    // Open the northwind-cms accordion
    fireEvent.click(await within(dialog).findByText('northwind-cms'))
    await within(dialog).findByText('database:read, database:write, projects:read')
    // Close the northwind-cms accordion
    fireEvent.click(await within(dialog).findByText('northwind-cms'))
  })

  test('labels an organization-bound grant and reports it as covering all projects', async () => {
    addAPIMock({
      path: '/platform/profile/oauth/grants',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthGrantsData>(
          createMockGrants([
            createMockGrant({
              attributes: {
                projects: null,
              },
            }),
          ])
        ),
    })
    customRender(<OAuthApps />)
    await openRowMenu('Vercel')
    await screen.findByText('Revoke access')
    expect(screen.queryByText('View projects')).not.toBeInTheDocument()

    await screen.findByText((_, element) => element?.textContent === 'All projects')
  })

  test('revokes on confirm', async () => {
    addAPIMock({
      path: '/platform/profile/oauth/grants',
      method: 'get',
      response: () => HttpResponse.json<OAuthGrantsData>(createMockGrants()),
    })
    addAPIMock({
      path: '/platform/profile/oauth/grants/:grant_id',
      method: 'delete',
      response: () => new HttpResponse('', { status: 200 }),
    })
    customRender(<OAuthApps />)

    await openRowMenu('Vercel')
    await userEvent.click(await screen.findByText('Revoke access'))

    await screen.findByText('Revoke access for Vercel')

    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Revoked access for Vercel')
    })
  })
})
