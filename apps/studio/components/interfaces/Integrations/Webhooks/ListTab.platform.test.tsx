import { screen, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WebhooksListTab } from './ListTab'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { ALL_FGA_PERMISSIONS, type PermissionsV2Response } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

// The pg-meta query endpoint is checked against `database_read`, so that is what gates the tab
const permissionsWithout = (...denied: string[]): PermissionsV2Response => ({
  organizations: [
    {
      slug: 'acme',
      role: 'developer',
      permissions: ALL_FGA_PERMISSIONS.filter((permission) => !denied.includes(permission)),
      projects: [],
    },
  ],
})

const triggerRequests = vi.fn()

/** Mocks every pg-meta query the tab fires and records the triggers query. */
function mockPgMetaQuery() {
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: ({ request }) => {
      if (new URL(request.url).searchParams.get('key') === 'triggers') triggerRequests()
      return HttpResponse.json([])
    },
  })
}

describe('WebhooksListTab grants', () => {
  beforeEach(() => {
    triggerRequests.mockClear()
    // Legacy permissions, requested by other components in the tab
    addAPIMock({ method: 'get', path: '/platform/profile/permissions', response: [] })
    mockPgMetaQuery()
  })

  it('shows the webhooks list when database_read is held', async () => {
    mockProjectGrantContext({ ref: 'default' })

    render(<WebhooksListTab />, { profileContext: createMockProfileContext() })

    expect(await screen.findByPlaceholderText('Search for a webhook')).toBeVisible()
  })

  it('shows a no-permission message without database_read', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: permissionsWithout('database_read') })

    render(<WebhooksListTab />, { profileContext: createMockProfileContext() })

    await waitFor(() =>
      expect(screen.getByText(/need additional permissions to view/)).toBeVisible()
    )
    expect(triggerRequests).not.toHaveBeenCalled()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()

    render(<WebhooksListTab />, { profileContext: createMockProfileContext() })

    await waitFor(() =>
      expect(screen.getByText(/Failed to check database webhooks permissions/)).toBeVisible()
    )
  })
})
