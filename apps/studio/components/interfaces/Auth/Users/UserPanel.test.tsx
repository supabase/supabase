import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { ResizablePanelGroup } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UserPanel } from './UserPanel'
import type { User } from '@/data/auth/users-infinite-query'
import { BASE_PATH } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

const { mockUser } = vi.hoisted(() => ({
  mockUser: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'user@example.com',
    providers: ['email'],
  } as unknown as User,
}))

// Project resolution is pure scaffolding here (it only supplies `ref` to the
// user query); mocking the whole project query chain over the network would add
// noise without testing anything this spec cares about.
vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: vi
    .fn()
    .mockReturnValue({ data: { ref: 'project-ref', connectionString: 'postgres://' } }),
}))

// Heavy tab bodies — the sanctioned use of vi.mock. This spec only asserts tab
// visibility, not what the tabs render.
vi.mock('./UserOverview', () => ({
  UserOverview: () => <div data-testid="user-overview" />,
}))
vi.mock('./UserLogs', () => ({
  UserLogs: () => <div data-testid="user-logs" />,
}))

const renderPanel = (disabledFeatures: string[] = []) => {
  // The user query flows through pg-meta SQL; mock it at the network boundary.
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () => HttpResponse.json([mockUser] as any),
  })

  // `/api/enabled-features-overrides` is a Next.js route, not an OpenAPI path,
  // so addAPIMock can't type it — register a raw handler. Feature state is
  // driven by the profile's disabled_features below.
  mswServer.use(
    http.get(`${BASE_PATH}/api/enabled-features-overrides`, () =>
      HttpResponse.json({ disabled_features: [] })
    )
  )

  return customRender(
    <ResizablePanelGroup orientation="horizontal">
      <UserPanel />
    </ResizablePanelGroup>,
    {
      nuqs: { searchParams: `?show=${mockUser.id}` },
      profileContext: createMockProfileContext({
        profile: {
          disabled_features: disabledFeatures as any,
        } as any,
      }),
    }
  )
}

describe('UserPanel', () => {
  const desktopWidth = window.innerWidth

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: desktopWidth })
  })

  it('shows the Logs tab when logs:all is enabled', async () => {
    renderPanel([])

    expect(await screen.findByRole('tab', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Logs' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Raw JSON' })).toBeInTheDocument()
  })

  it('hides the Logs tab when logs:all is disabled', async () => {
    renderPanel(['logs:all'])

    expect(await screen.findByRole('tab', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Logs' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Raw JSON' })).toBeInTheDocument()
  })

  it('uses a full-width dialog on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })

    renderPanel([])

    const dialog = await screen.findByRole('dialog', { name: 'User details' })
    expect(dialog).toHaveClass('w-screen')
    expect(screen.getByRole('button', { name: 'Close user details' })).toBeInTheDocument()
  })
})
