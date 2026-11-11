import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { Button } from 'ui'
import { useCurrentPage, useSetPage } from 'ui-patterns/CommandMenu'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useApiKeysCommands } from './ApiKeys'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import { useGrant } from '@/lib/grants'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { ALL_FGA_PERMISSIONS } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useHighAvailability: () => ({ isHighAvailability: false, isPending: false }),
}))

const API_KEYS: ApiKeyResponse[] = [
  {
    api_key: 'secret-key',
    hash: 'hash',
    id: 'secret-id',
    inserted_at: '2025-02-16T22:24:42.115195Z',
    name: 'sb_secret',
    type: 'secret',
  },
]

const CommandPageHarness = () => {
  useApiKeysCommands()
  // Same grant the commands use, rendered so tests can wait for it to resolve
  const { status } = useGrant(
    'GET /v1/projects/{ref}/api-keys',
    { projectRef: 'default' },
    { variant: 'reveal' }
  )
  const setPage = useSetPage()
  const page = useCurrentPage()
  const commands =
    page && 'sections' in page ? page.sections.flatMap((section) => section.commands) : []

  return (
    <>
      <p>reveal grant: {status}</p>
      <Button onClick={() => setPage('API Keys')}>Open API keys page</Button>
      <ul>
        {commands.map((command) => (
          <li key={command.id}>{command.name}</li>
        ))}
      </ul>
    </>
  )
}

describe('useApiKeysCommands grants', () => {
  const requests = vi.fn()

  beforeEach(() => {
    requests.mockClear()
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: ({ request }) => {
        requests(new URL(request.url).searchParams.get('reveal'))
        return HttpResponse.json<ApiKeyResponse[]>(API_KEYS)
      },
    })
  })

  it('requests revealed keys when the user can read secrets', async () => {
    mockProjectGrantContext({ ref: 'default' })

    customRender(<CommandPageHarness />, { profileContext: createMockProfileContext() })
    // The page registers once keys load, so keep opening it until it exists
    await waitFor(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Open API keys page' }))
      expect(screen.getByText('Copy secret key (sb_secret)')).toBeInTheDocument()
    })
    expect(requests).toHaveBeenCalledWith('true')
  })

  it('does not request keys when the user can read keys but not secrets', async () => {
    mockProjectGrantContext({
      ref: 'default',
      permissions: {
        organizations: [
          {
            slug: 'acme',
            role: 'developer',
            permissions: ALL_FGA_PERMISSIONS.filter(
              (permission) => permission !== FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_SECRET_READ
            ),
            projects: [],
          },
        ],
      },
    })

    customRender(<CommandPageHarness />, { profileContext: createMockProfileContext() })
    await userEvent.click(screen.getByRole('button', { name: 'Open API keys page' }))

    expect(await screen.findByText('reveal grant: denied')).toBeVisible()
    expect(screen.queryByText(/Copy secret key/)).not.toBeInTheDocument()
    expect(requests).not.toHaveBeenCalled()
  })
})
