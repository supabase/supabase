import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SiteUrl from './SiteUrl'
import type { AuthConfigResponse } from '@/data/auth/auth-config-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isSuccess: true }),
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

    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: { SITE_URL: CURRENT_SITE_URL } as unknown as AuthConfigResponse,
    })
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
