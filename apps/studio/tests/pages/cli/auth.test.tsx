import { fireEvent, screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { ProfileContextType } from '@/lib/profile'
import { CliAuthScreen } from '@/pages/cli/auth'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']

let mockQuery: Record<string, string | string[] | undefined> = {}

vi.mock('next/router', () => ({
  useRouter: () => ({
    isReady: true,
    push: vi.fn(),
    query: mockQuery,
  }),
}))

const PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'test@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

const CODE = 'ABCD1234'
const REDIRECT_URI = 'http://127.0.0.1:54321/callback'

function renderCliAuthScreen() {
  return customRender(
    <CliAuthScreen code={CODE} redirectUri={REDIRECT_URI} projectRef="test-project-ref" />,
    { profileContext: PROFILE_CONTEXT }
  )
}

function mockLocationAssign() {
  const assign = vi.fn()
  Object.defineProperty(window, 'location', {
    value: { ...window.location, assign },
    writable: true,
    configurable: true,
  })
  return assign
}

beforeEach(() => {
  mockQuery = {}
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () => HttpResponse.json<OrganizationResponse[]>([]),
  })
})

describe('CliAuthScreen requested scopes', () => {
  test('renders valid scopes grouped by access level and sends that list on authorize', async () => {
    mockQuery = { scopes: 'project:database:write,project:snippets:read' }
    const assign = mockLocationAssign()

    renderCliAuthScreen()

    expect(await screen.findByText('Database')).toBeInTheDocument()
    expect(screen.getByText('SQL Snippets')).toBeInTheDocument()
    expect(screen.getByText('READ-WRITE')).toBeInTheDocument()
    expect(screen.getByText('READ')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Authorize CLI' }))

    await waitFor(() => expect(assign).toHaveBeenCalled())
    const redirectUrl = assign.mock.calls[0][0] as string
    expect(redirectUrl).toContain('scopes=project:database:write,project:snippets:read')
  })

  test('groups multiple resources of the same level into one comma-separated row', async () => {
    mockQuery = { scopes: 'project:admin:write,project:action_runs:write' }

    renderCliAuthScreen()

    expect(await screen.findByText('Project Settings, Action Runs')).toBeInTheDocument()
    expect(screen.queryByText('READ')).not.toBeInTheDocument()
  })

  test('collapses a repeated read+write param into a single write entry', async () => {
    mockQuery = { scopes: ['project:database:read', 'project:database:write'] }
    const assign = mockLocationAssign()

    renderCliAuthScreen()

    expect(await screen.findByText('Database')).toBeInTheDocument()
    expect(screen.getByText('READ-WRITE')).toBeInTheDocument()
    expect(screen.queryByText('READ')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Authorize CLI' }))

    await waitFor(() => expect(assign).toHaveBeenCalled())
    const redirectUrl = assign.mock.calls[0][0] as string
    expect(redirectUrl).toContain('scopes=project:database:write')
    expect(redirectUrl).not.toContain('project:database:read')
  })

  test('drops an unrecognised scope without rendering it, keeping the valid ones', async () => {
    mockQuery = { scopes: 'project:database:write,project:bogus:read' }
    const assign = mockLocationAssign()

    renderCliAuthScreen()

    expect(await screen.findByText('Database')).toBeInTheDocument()
    expect(screen.queryByText(/bogus/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Authorize CLI' })).not.toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Authorize CLI' }))

    await waitFor(() => expect(assign).toHaveBeenCalled())
    const redirectUrl = assign.mock.calls[0][0] as string
    expect(redirectUrl).toContain('scopes=project:database:write')
  })

  test('shows "No permissions requested" when no scopes were passed', async () => {
    mockQuery = {}

    renderCliAuthScreen()

    expect(await screen.findByText('No permissions requested.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Authorize CLI' })).not.toBeDisabled()
  })

  test('hides commands until the toggle is expanded', async () => {
    mockQuery = { scopes: 'project:database:write,project:storage:read' }

    renderCliAuthScreen()

    const toggle = await screen.findByRole('button', { name: 'Show commands' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('db push')).not.toBeInTheDocument()

    fireEvent.click(toggle)

    const expandedToggle = screen.getByRole('button', { name: 'Hide commands' })
    expect(expandedToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('db push')).toBeInTheDocument()
    expect(screen.getByText('storage ls')).toBeInTheDocument()
    expect(screen.queryByText('READ-WRITE')).not.toBeInTheDocument()

    fireEvent.click(expandedToggle)

    expect(screen.getByRole('button', { name: 'Show commands' })).toBeInTheDocument()
    expect(screen.queryByText('db push')).not.toBeInTheDocument()
    expect(screen.getByText('READ-WRITE')).toBeInTheDocument()
  })

  test('lists write commands before read commands, and write resources first', async () => {
    mockQuery = { scopes: 'project:snippets:read,project:database:write' }

    renderCliAuthScreen()

    fireEvent.click(await screen.findByRole('button', { name: 'Show commands' }))

    const commands = screen.getAllByText(/^(db|gen|snippets) /).map((node) => node.textContent)
    expect(commands).toEqual(['db push', 'db reset', 'db dump', 'gen types', 'snippets list'])
  })

  test('renders a resource with no mapped commands as a name-only row', async () => {
    mockQuery = { scopes: 'project:advisors:read' }

    renderCliAuthScreen()

    fireEvent.click(await screen.findByRole('button', { name: 'Show commands' }))

    expect(screen.getByText('Advisors')).toBeInTheDocument()
    expect(document.querySelectorAll('code')).toHaveLength(0)
  })
})
