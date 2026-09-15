import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RedirectUrls } from './RedirectUrls'
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

mockAnimationsApi()

const URLS = ['https://one.example.com', 'https://two.example.com', 'https://three.example.com']

const mockAuthConfig = (uriAllowList: string) =>
  addAPIMock({
    method: 'get',
    path: '/platform/auth/:ref/config',
    response: { URI_ALLOW_LIST: uriAllowList } as unknown as AuthConfigResponse,
  })

const mockUpdateAuthConfig = () => {
  const requests: Array<{ body: unknown }> = []
  addAPIMock({
    method: 'patch',
    path: '/platform/auth/:ref/config',
    response: async ({ request }) => {
      requests.push({ body: await request.json() })
      return HttpResponse.json<AuthConfigResponse>({} as unknown as AuthConfigResponse)
    },
  })
  return requests
}

const rowFor = (url: string) => screen.getByRole('row', { name: new RegExp(url) })

describe('RedirectUrls', () => {
  beforeEach(() => {
    mockAuthConfig(URLS.join(','))
  })

  it('lists each redirect URL with a total in the table caption', async () => {
    customRender(<RedirectUrls />)

    for (const url of URLS) {
      expect(await screen.findByText(url)).toBeInTheDocument()
    }
    expect(screen.getByText('3 redirect URLs')).toBeInTheDocument()
  })

  it('shows an empty state inside the table when there are no URLs', async () => {
    mockAuthConfig('')

    customRender(<RedirectUrls />)

    expect(await screen.findByText('No redirect URLs')).toBeInTheDocument()
    expect(document.querySelector('caption')).toBeNull()
    expect(screen.getByRole('checkbox', { name: 'Select all redirect URLs' })).toBeDisabled()
  })

  it('removes every URL selected through the select-all checkbox', async () => {
    const user = userEvent.setup()
    const requests = mockUpdateAuthConfig()

    customRender(<RedirectUrls />)

    await user.click(await screen.findByRole('checkbox', { name: 'Select all redirect URLs' }))

    expect(screen.getByText('3 selected')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove (3)' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Remove 3 redirect URLs?')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Remove URLs' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].body).toEqual({ URI_ALLOW_LIST: '' })
  })

  it('removes only the URL chosen from its row actions', async () => {
    const user = userEvent.setup()
    const requests = mockUpdateAuthConfig()

    customRender(<RedirectUrls />)

    await waitFor(() => expect(screen.getByText(URLS[1])).toBeInTheDocument())
    await user.click(
      within(rowFor(URLS[1])).getByRole('button', { name: `Actions for ${URLS[1]}` })
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Remove URL' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Remove 1 redirect URL?')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Remove URL' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].body).toEqual({ URI_ALLOW_LIST: `${URLS[0]},${URLS[2]}` })
  })

  it('clears the selection without removing anything', async () => {
    const user = userEvent.setup()
    const requests = mockUpdateAuthConfig()

    customRender(<RedirectUrls />)

    await waitFor(() => expect(screen.getByText(URLS[0])).toBeInTheDocument())
    await user.click(within(rowFor(URLS[0])).getByRole('checkbox'))

    expect(screen.getByText('1 selected')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(screen.queryByText('1 selected')).not.toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })
})
