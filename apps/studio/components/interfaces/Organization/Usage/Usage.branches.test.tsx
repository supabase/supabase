import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import type { UrlUpdateEvent } from 'nuqs/adapters/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Usage } from './Usage'
import type { Branch } from '@/data/branches/branches-query'
import { createMockOrganizationResponse, createMockProject } from '@/tests/helpers'
import { createTestBranch } from '@/tests/lib/branch-test-utils'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { routerMock } from '@/tests/lib/route-mock'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useIsLoggedIn: () => true,
}))

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => routerMock.pathname,
}))

const parent = createMockProject({ ref: 'parent-ref', name: 'Parent project' })
const branch = createTestBranch({ name: 'Preview branch' })
const main = createTestBranch({ id: 'main-id', project_ref: parent.ref, is_default: true })
const parentDetail: components['schemas']['ProjectDetailResponse_Output'] = {
  ...parent,
  connectionString: null,
  db_host: 'db.parent-ref.supabase.co',
  high_availability: false,
  integration_source: null,
  inserted_at: '2026-01-01T00:00:00Z',
  is_physical_backups_enabled: false,
  restUrl: 'https://parent-ref.supabase.co',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00Z',
}
const branchDetail = {
  ...parentDetail,
  ref: branch.project_ref,
  name: branch.name,
  parent_project_ref: parent.ref,
}

function renderUsage(branchRef: string | null = branch.project_ref, projectRef = parent.ref) {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>()
  const searchParams: Record<string, string> = { projectRef }
  if (branchRef !== null) searchParams.branchRef = branchRef
  routerMock.setCurrentUrl({
    pathname: '/org/test-org/usage',
    query: { slug: 'test-org', ...searchParams },
  })
  customRender(<Usage />, {
    profileContext: createMockProfileContext(),
    nuqs: { searchParams, hasMemory: true, onUrlUpdate },
  })
  return { onUrlUpdate }
}

function captureUsageRequests() {
  const requests: { usage: (string | null)[]; daily: (string | null)[] } = {
    usage: [],
    daily: [],
  }
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/usage',
    response: ({ request }) => {
      requests.usage.push(new URL(request.url).searchParams.get('project_ref'))
      return HttpResponse.json<components['schemas']['OrgUsageResponse_Output']>({
        usages: [],
        usage_billing_enabled: false,
      })
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/usage/daily',
    response: ({ request }) => {
      requests.daily.push(new URL(request.url).searchParams.get('project_ref'))
      return HttpResponse.json<components['schemas']['OrgDailyUsageResponse_Output']>({
        usages: [],
      })
    },
  })
  return requests
}

describe('Usage branch URLs', () => {
  beforeEach(() => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: ({ params }) =>
        HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>(
          params.ref === branch.project_ref ? branchDetail : parentDetail
        ),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () =>
        HttpResponse.json<components['schemas']['OrganizationResponse_Output'][]>([
          createMockOrganizationResponse({ slug: 'test-org' }),
        ]),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/profile/permissions',
      response: () =>
        HttpResponse.json<components['schemas']['AccessControlPermission'][]>([
          {
            actions: ['%'],
            resources: ['%'],
            organization_id: 1,
            organization_slug: 'test-org',
            project_ids: [],
            project_refs: [],
            condition: null,
            restrictive: false,
          },
        ]),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/billing/subscription',
      response: () =>
        HttpResponse.json<components['schemas']['GetSubscriptionResponse']>({
          addons: [],
          billing_via_partner: false,
          current_period_start: 1767225600,
          current_period_end: 1769904000,
          next_invoice_at: 1769904000,
          payment_method_type: 'card',
          plan: { id: 'free', name: 'Free' },
          project_addons: [],
          usage_billing_enabled: false,
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: () => HttpResponse.json<Branch[]>([main, branch]),
    })
  })

  it('requests both usage endpoints with the branch project ref from the URL', async () => {
    const requests = captureUsageRequests()
    renderUsage()

    expect(await screen.findByText(`${branch.name} branch only.`)).toBeInTheDocument()
    await waitFor(() => {
      expect(requests).toEqual({ usage: [branch.project_ref], daily: [branch.project_ref] })
    })
    expect(screen.getByLabelText('Filter by branch')).toHaveTextContent(branch.name)
    expect(screen.queryByText('Branch unavailable')).not.toBeInTheDocument()
  })

  it('resolves a direct branch URL and switches to main and organization totals', async () => {
    const user = userEvent.setup()
    const requests = captureUsageRequests()
    const branchListRefs: string[] = []
    const projectRefs: string[] = []
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: ({ params }) => {
        projectRefs.push(String(params.ref))
        return HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>(
          params.ref === branch.project_ref ? branchDetail : parentDetail
        )
      },
    })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: ({ params }) => {
        branchListRefs.push(String(params.ref))
        return HttpResponse.json<Branch[]>([main, branch])
      },
    })
    const { onUrlUpdate } = renderUsage(null, branch.project_ref)

    expect(await screen.findByText(`${branch.name} branch only.`)).toBeInTheDocument()
    await waitFor(() => {
      expect(requests).toEqual({ usage: [branch.project_ref], daily: [branch.project_ref] })
    })
    expect(projectRefs).toEqual([branch.project_ref, parent.ref])
    expect(branchListRefs).toEqual([parent.ref])
    expect(screen.getByLabelText('Filter by branch')).toHaveTextContent(branch.name)
    expect(screen.getByRole('combobox', { name: '' })).toHaveTextContent(parent.name)

    await user.click(screen.getByLabelText('Filter by branch'))
    await user.click(await screen.findByRole('option', { name: main.name }))

    expect(
      await screen.findByText('Main branch only. Other branches are tracked separately.')
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(requests).toEqual({
        usage: [branch.project_ref, parent.ref],
        daily: [branch.project_ref, parent.ref],
      })
    })
    expect(screen.getByLabelText('Filter by branch')).toHaveTextContent(main.name)
    expect(branchListRefs).toEqual([parent.ref])

    await user.click(screen.getByLabelText('Filter by branch'))
    await user.click(await screen.findByRole('option', { name: branch.name }))
    expect(await screen.findByText(`${branch.name} branch only.`)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'View organization total' }))

    await waitFor(() => {
      expect(requests).toEqual({
        usage: [branch.project_ref, parent.ref, null],
        daily: [branch.project_ref, parent.ref, null],
      })
      const searchParams = onUrlUpdate.mock.lastCall?.[0].searchParams
      expect(searchParams).toBeDefined()
      expect(searchParams?.has('projectRef')).toBe(false)
      expect(searchParams?.has('branchRef')).toBe(false)
    })
    expect(screen.queryByLabelText('Filter by branch')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'View organization total' })
    ).not.toBeInTheDocument()
  })

  it('waits for direct branch project details before requesting branches or usage', async () => {
    const requests = captureUsageRequests()
    const response = Promise.withResolvers<void>()
    const projectRequested = vi.fn()
    const branchListRefs: string[] = []
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: async ({ params }) => {
        if (params.ref === branch.project_ref) {
          projectRequested()
          await response.promise
          return HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>(
            branchDetail
          )
        }
        return HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>(
          parentDetail
        )
      },
    })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: ({ params }) => {
        branchListRefs.push(String(params.ref))
        return HttpResponse.json<Branch[]>([main, branch])
      },
    })
    renderUsage(null, branch.project_ref)

    try {
      await waitFor(() => expect(projectRequested).toHaveBeenCalledOnce())
      expect(screen.queryByText('Usage Summary')).not.toBeInTheDocument()
      expect(branchListRefs).toEqual([])
      expect(requests).toEqual({ usage: [], daily: [] })
    } finally {
      await act(async () => response.resolve())
    }

    expect(await screen.findByText(`${branch.name} branch only.`)).toBeInTheDocument()
    await waitFor(() => {
      expect(requests).toEqual({ usage: [branch.project_ref], daily: [branch.project_ref] })
    })
    expect(branchListRefs).toEqual([parent.ref])
  })

  it('blocks a direct branch link when its parent project lookup fails', async () => {
    const requests = captureUsageRequests()
    const branchRequested = vi.fn()
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: ({ params }) =>
        params.ref === branch.project_ref
          ? HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>(branchDetail)
          : HttpResponse.json<APIErrorBody>({ message: 'Parent lookup failed' }, { status: 500 }),
    })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: () => {
        branchRequested()
        return HttpResponse.json<Branch[]>([main, branch])
      },
    })
    renderUsage(null, branch.project_ref)

    expect(await screen.findByText('Failed to retrieve project')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading branch usage' })).not.toBeInTheDocument()
    expect(screen.queryByText('Usage Summary')).not.toBeInTheDocument()
    expect(branchRequested).not.toHaveBeenCalled()
    expect(requests).toEqual({ usage: [], daily: [] })
  })

  it('does not request parent usage while the branch list is pending', async () => {
    const requests = captureUsageRequests()
    const response = Promise.withResolvers<Branch[]>()
    const branchRequested = vi.fn()
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: async () => {
        branchRequested()
        return HttpResponse.json<Branch[]>(await response.promise)
      },
    })
    renderUsage()

    try {
      await waitFor(() => expect(branchRequested).toHaveBeenCalledOnce())
      expect(await screen.findByText('Free Plan')).toBeInTheDocument()
      expect(screen.getByRole('status', { name: 'Loading branch usage' })).toBeInTheDocument()
      expect(screen.queryByText('Usage Summary')).not.toBeInTheDocument()
      expect(requests).toEqual({ usage: [], daily: [] })
    } finally {
      await act(async () => response.resolve([main, branch]))
    }

    await waitFor(() => {
      expect(requests).toEqual({ usage: [branch.project_ref], daily: [branch.project_ref] })
    })
  })

  it('shows a branch error without requesting parent usage when the branch list fails', async () => {
    const requests = captureUsageRequests()
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Branch lookup failed' }, { status: 500 }),
    })
    renderUsage()

    expect(await screen.findByText('Failed to retrieve branches')).toBeInTheDocument()
    expect(await screen.findByText('Free Plan')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading branch usage' })).not.toBeInTheDocument()
    expect(screen.queryByText('Branch unavailable')).not.toBeInTheDocument()
    expect(screen.queryByText('Usage Summary')).not.toBeInTheDocument()
    expect(requests).toEqual({ usage: [], daily: [] })
  })

  it('shows Branch unavailable and requests parent usage for a deleted branch ref', async () => {
    const requests = captureUsageRequests()
    renderUsage('deleted-branch-ref')

    expect(await screen.findByText('Branch unavailable')).toBeInTheDocument()
    expect(
      screen.getByText('Main branch only. Other branches are tracked separately.')
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(requests).toEqual({ usage: [parent.ref], daily: [parent.ref] })
    })
  })

  it('shows a project error without loading branch usage when the parent lookup fails', async () => {
    const requests = captureUsageRequests()
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Project lookup failed' }, { status: 500 }),
    })
    renderUsage()

    expect(await screen.findByText('Failed to retrieve project')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading branch usage' })).not.toBeInTheDocument()
    expect(screen.queryByText('Usage Summary')).not.toBeInTheDocument()
    expect(requests).toEqual({ usage: [], daily: [] })
  })
})
