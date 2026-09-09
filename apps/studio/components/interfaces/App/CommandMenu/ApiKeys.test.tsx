import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { Button } from 'ui'
import { useCurrentPage, useSetPage } from 'ui-patterns/CommandMenu'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useApiKeysCommands } from './ApiKeys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ApiKeyResponse = components['schemas']['ApiKeyResponse']

const { mockUseAsyncCheckPermissions, mockUseHighAvailability, mockUseSelectedProjectQuery } =
  vi.hoisted(() => ({
    mockUseAsyncCheckPermissions: vi.fn(),
    mockUseHighAvailability: vi.fn(),
    mockUseSelectedProjectQuery: vi.fn(),
  }))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useHighAvailability: mockUseHighAvailability,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

const API_KEYS: ApiKeyResponse[] = [
  { api_key: 'anon-key', name: 'anon', type: 'legacy' },
  { api_key: 'service-key', name: 'service_role', type: 'legacy' },
  {
    api_key: 'publishable-key',
    hash: 'hash',
    id: 'publishable-id',
    inserted_at: '2025-02-16T22:24:42.115195Z',
    name: 'default',
    type: 'publishable',
  },
  {
    api_key: 'secret-key',
    hash: 'hash',
    id: 'secret-id',
    inserted_at: '2025-02-16T22:24:42.115195Z',
    name: 'sb_secret',
    type: 'secret',
  },
]

/** Renders the API keys command page so its commands can be asserted on. */
const CommandPageHarness = () => {
  useApiKeysCommands()
  const setPage = useSetPage()
  const page = useCurrentPage()
  const commands =
    page && 'sections' in page ? page.sections.flatMap((section) => section.commands) : []

  return (
    <>
      <Button onClick={() => setPage('API Keys')}>Open API keys page</Button>
      <ul>
        {commands.map((command) => (
          <li key={command.id}>{command.name}</li>
        ))}
      </ul>
    </>
  )
}

async function renderCommandPage() {
  customRender(<CommandPageHarness />)

  await userEvent.click(screen.getByRole('button', { name: 'Open API keys page' }))
}

describe('useApiKeysCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAsyncCheckPermissions.mockReturnValue({ can: true })
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { id: 1, ref: 'default', name: 'default' },
    })
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: false, isPending: false })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: () => HttpResponse.json<ApiKeyResponse[]>(API_KEYS),
    })
  })

  it('omits the legacy key commands on High Availability projects', async () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: true, isPending: false })

    await renderCommandPage()

    expect(await screen.findByText('Copy publishable key')).toBeInTheDocument()
    expect(screen.getByText('Copy secret key (sb_secret)')).toBeInTheDocument()
    expect(screen.queryByText('Copy anonymous API key')).not.toBeInTheDocument()
    expect(screen.queryByText('Copy service API key')).not.toBeInTheDocument()
  })

  it('includes the legacy key commands on other projects', async () => {
    await renderCommandPage()

    expect(await screen.findByText('Copy anonymous API key')).toBeInTheDocument()
    expect(screen.getByText('Copy service API key')).toBeInTheDocument()
    expect(screen.getByText('Copy publishable key')).toBeInTheDocument()
    expect(screen.getByText('Copy secret key (sb_secret)')).toBeInTheDocument()
  })
})
