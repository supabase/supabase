import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SiteUrl from './SiteUrl'
import type { AuthConfigResponse } from '@/data/auth/auth-config-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const githubConfigMock = vi.hoisted(() => vi.fn())

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isSuccess: true }),
}))

vi.mock('@/hooks/misc/useGitHubConfigDrift', () => ({
  useSelectedGitHubConfig: githubConfigMock,
}))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return true
    },
  }
})

const CURRENT_SITE_URL = 'https://old.example.com'

const renderSiteUrl = () => customRender(<SiteUrl />)

describe('SiteUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    githubConfigMock.mockReturnValue({ data: undefined })

    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: { SITE_URL: CURRENT_SITE_URL } as unknown as AuthConfigResponse,
    })
  })

  it('shows the managed config callout when the site URL matches config.toml', async () => {
    githubConfigMock.mockReturnValue({
      data: { config: { auth: { site_url: CURRENT_SITE_URL } } },
    })

    renderSiteUrl()

    expect(await screen.findByText('Managed by config.toml')).toBeInTheDocument()
    expect(screen.getByText('Managed by config.toml').parentElement).toHaveTextContent(
      'current environment matches auth.site_url.'
    )
  })

  it('shows drift from the platform default when site URL is absent from code-managed config', async () => {
    githubConfigMock.mockReturnValue({
      data: { config: { config_source: 'code', auth: {} } },
    })

    renderSiteUrl()

    expect(await screen.findByText('Drift from config.toml')).toBeInTheDocument()
    expect(screen.getByText('Drift from config.toml').parentElement).toHaveTextContent(
      'current environment differs from auth.site_url and is currently active.'
    )
  })

  it('does not show a config callout when an absent site URL still uses the platform default', async () => {
    githubConfigMock.mockReturnValue({
      data: { config: { config_source: 'code', auth: {} } },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: { SITE_URL: 'http://localhost:3000' } as unknown as AuthConfigResponse,
    })

    renderSiteUrl()

    expect(await screen.findByDisplayValue('http://localhost:3000')).toBeInTheDocument()
    expect(screen.queryByText('Managed by config.toml')).not.toBeInTheDocument()
    expect(screen.queryByText('Drift from config.toml')).not.toBeInTheDocument()
  })

  it('trims leading and trailing whitespace from the site URL before submitting', async () => {
    const user = userEvent.setup()

    const requests: Array<{ body: unknown }> = []
    addAPIMock({
      method: 'patch',
      path: '/platform/auth/:ref/config',
      response: async ({ request }) => {
        requests.push({ body: await request.json() })
        return HttpResponse.json<AuthConfigResponse>({
          SITE_URL: 'https://new.example.com',
        } as unknown as AuthConfigResponse)
      },
    })

    renderSiteUrl()

    const input = await screen.findByDisplayValue(CURRENT_SITE_URL)

    await user.clear(input)
    await user.type(input, '   https://new.example.com   ')

    fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].body).toEqual({ SITE_URL: 'https://new.example.com' })
    expect(toast.success).toHaveBeenCalledWith('Successfully updated site URL')
  })

  it('shows a validation error and does not submit when the value is only whitespace', async () => {
    const user = userEvent.setup()

    const requests: Array<{ body: unknown }> = []
    addAPIMock({
      method: 'patch',
      path: '/platform/auth/:ref/config',
      response: async ({ request }) => {
        requests.push({ body: await request.json() })
        return HttpResponse.json<AuthConfigResponse>({
          SITE_URL: '',
        } as unknown as AuthConfigResponse)
      },
    })

    renderSiteUrl()

    const input = await screen.findByDisplayValue(CURRENT_SITE_URL)

    await user.clear(input)
    await user.type(input, '     ')

    fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Must have a Site URL')).toBeInTheDocument()
    await waitFor(() => expect(requests).toHaveLength(0))
    expect(toast.success).not.toHaveBeenCalled()
  })
})
