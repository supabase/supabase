import { fireEvent, screen, waitFor } from '@testing-library/react'
import { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiKeyPill } from './ApiKeyPill'
import type { APIKeysData } from '@/data/api-keys/api-keys-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { ALL_FGA_PERMISSIONS } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

// CopyButton writes via copyToClipboard from 'ui'. Stub just that export so we can
// assert the value handed to the clipboard without depending on jsdom's
// document.hasFocus() / navigator.clipboard. Everything else in 'ui' stays real.
const { mockCopyToClipboard } = vi.hoisted(() => ({ mockCopyToClipboard: vi.fn() }))
const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))

vi.mock('ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ui')>()),
  copyToClipboard: mockCopyToClipboard,
}))

// The masked value the list endpoint returns for a secret key (first 15 chars),
// and the full key the reveal-by-id endpoint returns.
const MASKED = 'sb_secret_abcde'
const FULL = 'sb_secret_abcdefghijklmnop'

// ApiKeyPill is strongly typed against the query's secret-key shape; the fields it
// reads are id/type/api_key, so cast a minimal object through unknown.
const secretKey = {
  id: 'secret',
  name: 'secret',
  type: 'secret',
  api_key: MASKED,
  prefix: MASKED,
} as unknown as Extract<APIKeysData[number], { type: 'secret' }>

const publishableKey = {
  id: 'pub',
  name: 'default',
  type: 'publishable',
  api_key: 'sb_publishable_xyz',
} as unknown as Extract<APIKeysData[number], { type: 'publishable' }>

function mockRevealById(onRequest?: () => void) {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys/:id',
    response: () => {
      onRequest?.()
      return HttpResponse.json<ApiKeyResponse>({
        id: 'secret',
        name: 'secret',
        type: 'secret',
        api_key: FULL,
        prefix: MASKED,
      })
    },
  })
}

describe('ApiKeyPill', () => {
  beforeEach(() => {
    mockCopyToClipboard.mockReset()
    // Mirror the real helper: the callback runs once the text resolves and the write succeeds
    mockCopyToClipboard.mockImplementation(
      async (text: string | Promise<string>, onSuccess?: () => void) => {
        await text
        onSuccess?.()
      }
    )
    mockTrack.mockClear()
  })

  it('masks the secret key by default and does not expose the full key', () => {
    mockProjectGrantContext({ ref: 'default' })
    customRender(<ApiKeyPill apiKey={secretKey} />, { profileContext: createMockProfileContext() })

    expect(screen.getByText(MASKED)).toBeInTheDocument()
    expect(screen.queryByText(FULL.slice(15))).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reveal API key' })).toBeInTheDocument()
  })

  it('reveals the full secret key when the reveal button is clicked', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockRevealById()
    customRender(<ApiKeyPill apiKey={secretKey} />, { profileContext: createMockProfileContext() })

    const reveal = screen.getByRole('button', { name: 'Reveal API key' })
    await waitFor(() => expect(reveal).toBeEnabled())
    fireEvent.click(reveal)

    expect(await screen.findByText(FULL.slice(15))).toBeInTheDocument()
    expect(mockTrack).toHaveBeenCalledTimes(1)
    expect(mockTrack).toHaveBeenCalledWith('api_key_reveal_clicked', { keyType: 'secret' })
  })

  it('does not track a reveal when hiding the key again', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockRevealById()
    customRender(<ApiKeyPill apiKey={secretKey} />, { profileContext: createMockProfileContext() })

    const reveal = screen.getByRole('button', { name: 'Reveal API key' })
    await waitFor(() => expect(reveal).toBeEnabled())
    fireEvent.click(reveal)
    const hide = await screen.findByRole('button', { name: 'Hide API key' })
    await waitFor(() => expect(hide).toBeEnabled())
    fireEvent.click(hide)

    expect(await screen.findByRole('button', { name: 'Reveal API key' })).toBeInTheDocument()
    expect(mockTrack).toHaveBeenCalledTimes(1)
  })

  it('copies the full secret key to the clipboard', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockRevealById()
    customRender(<ApiKeyPill apiKey={secretKey} />, { profileContext: createMockProfileContext() })

    const copy = screen.getByRole('button', { name: 'Copy API key' })
    await waitFor(() => expect(copy).toBeEnabled())
    fireEvent.click(copy)

    await waitFor(() => expect(mockCopyToClipboard).toHaveBeenCalled())
    await expect(Promise.resolve(mockCopyToClipboard.mock.calls[0][0])).resolves.toBe(FULL)
    await waitFor(() => expect(mockTrack).toHaveBeenCalledTimes(1))
    expect(mockTrack).toHaveBeenCalledWith('api_key_copied', { keyType: 'secret' })
  })

  it('does not track a copy when the clipboard write fails', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockCopyToClipboard.mockImplementation(() => {})
    customRender(<ApiKeyPill apiKey={publishableKey} />, {
      profileContext: createMockProfileContext(),
    })

    const copy = screen.getByRole('button', { name: 'Copy API key' })
    await waitFor(() => expect(copy).toBeEnabled())
    fireEvent.click(copy)

    await waitFor(() => expect(mockCopyToClipboard).toHaveBeenCalled())
    expect(mockTrack).not.toHaveBeenCalled()
  })

  it('does not track a copy when revealing the secret key fails', async () => {
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys/:id',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Internal error' }, { status: 500 }),
    })
    customRender(<ApiKeyPill apiKey={secretKey} />, { profileContext: createMockProfileContext() })

    const copy = screen.getByRole('button', { name: 'Copy API key' })
    await waitFor(() => expect(copy).toBeEnabled())
    fireEvent.click(copy)

    await waitFor(() => expect(mockCopyToClipboard).toHaveBeenCalled())
    expect(mockTrack).not.toHaveBeenCalled()
  })

  it('tracks copying a publishable key', async () => {
    mockProjectGrantContext({ ref: 'default' })
    customRender(<ApiKeyPill apiKey={publishableKey} />, {
      profileContext: createMockProfileContext(),
    })

    const copy = screen.getByRole('button', { name: 'Copy API key' })
    await waitFor(() => expect(copy).toBeEnabled())
    fireEvent.click(copy)

    await waitFor(() => expect(mockTrack).toHaveBeenCalledTimes(1))
    expect(mockTrack).toHaveBeenCalledWith('api_key_copied', { keyType: 'publishable' })
  })

  it('disables reveal and copy without requesting the key when the grant is denied', async () => {
    const requests = vi.fn()
    mockProjectGrantContext({
      ref: 'default',
      permissions: {
        organizations: [
          {
            slug: 'acme',
            role: 'owner',
            // Has the base read permission but not secret_read
            permissions: ALL_FGA_PERMISSIONS.filter((p) => p !== 'api_gateway_keys_secret_read'),
            projects: [],
          },
        ],
      },
    })
    mockRevealById(requests)
    customRender(<ApiKeyPill apiKey={secretKey} />, { profileContext: createMockProfileContext() })

    const reveal = screen.getByRole('button', { name: 'Reveal API key' })
    await waitFor(() => expect(reveal).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Copy API key' })).toBeDisabled()

    fireEvent.click(reveal)
    expect(requests).not.toHaveBeenCalled()
    expect(mockTrack).not.toHaveBeenCalled()
  })

  it('disables reveal and copy when permissions fail to load', async () => {
    const requests = vi.fn()
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()
    mockRevealById(requests)
    customRender(<ApiKeyPill apiKey={secretKey} />, { profileContext: createMockProfileContext() })

    const reveal = screen.getByRole('button', { name: 'Reveal API key' })
    await waitFor(() => expect(reveal).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Copy API key' })).toBeDisabled()
    expect(requests).not.toHaveBeenCalled()
  })

  it('does not gate a publishable key on the reveal grant', async () => {
    mockPermissionsError()
    customRender(<ApiKeyPill apiKey={publishableKey} />, {
      profileContext: createMockProfileContext(),
    })

    expect(screen.getByText('sb_publishable_xyz')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copy API key' })).toBeEnabled())
  })
})
