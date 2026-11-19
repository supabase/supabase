import { screen, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FunctionsList } from './FunctionsList'
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

const functionsRequests = vi.fn()

describe('FunctionsList grants', () => {
  beforeEach(() => {
    functionsRequests.mockClear()
    addAPIMock({ method: 'get', path: '/platform/profile/permissions', response: [] })
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: ({ request }) => {
        if (new URL(request.url).searchParams.get('key') === 'database-functions') {
          functionsRequests()
        }
        return HttpResponse.json([])
      },
    })
  })

  it('enables creating functions when the write grant is held', async () => {
    mockProjectGrantContext({ ref: 'default' })

    render(<FunctionsList />, { profileContext: createMockProfileContext() })

    const buttons = await screen.findAllByRole('button', { name: 'New function' })
    for (const button of buttons) expect(button).toBeEnabled()
  })

  it('disables creating functions when only the read grant is held', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: permissionsWithout('database_write') })

    render(<FunctionsList />, { profileContext: createMockProfileContext() })

    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: 'New function' })
      for (const button of buttons) expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })

  it('shows a no-permission message without requesting functions when read is denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: permissionsWithout('database_read') })

    render(<FunctionsList />, { profileContext: createMockProfileContext() })

    await waitFor(() =>
      expect(
        screen.getByText(/need additional permissions to view database functions/)
      ).toBeVisible()
    )
    expect(functionsRequests).not.toHaveBeenCalled()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()

    render(<FunctionsList />, { profileContext: createMockProfileContext() })

    await waitFor(() =>
      expect(screen.getByText(/Failed to check database functions permissions/)).toBeVisible()
    )
  })
})
