import { fireEvent, screen, waitFor } from '@testing-library/react'
import { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiKeyPill } from './ApiKeyPill'
import type { APIKeysData } from '@/data/api-keys/api-keys-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ApiKeyResponse = components['schemas']['ApiKeyResponse']

// Permissions are non-network global state — mock the hook (the skill's allowed
// exception), matching the neighboring PublishableAPIKeys.test.tsx.
const { mockUseAsyncCheckPermissions } = vi.hoisted(() => ({
  mockUseAsyncCheckPermissions: vi.fn(),
}))
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

// CopyButton writes via copyToClipboard from 'ui'. Stub just that export so we can
// assert the value handed to the clipboard without depending on jsdom's
// document.hasFocus() / navigator.clipboard. Everything else in 'ui' stays real.
const { mockCopyToClipboard } = vi.hoisted(() => ({ mockCopyToClipboard: vi.fn() }))
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

function mockRevealById() {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys/:id',
    response: () =>
      HttpResponse.json<ApiKeyResponse>({
        id: 'secret',
        name: 'secret',
        type: 'secret',
        api_key: FULL,
        prefix: MASKED,
      }),
  })
}

describe('ApiKeyPill', () => {
  beforeEach(() => {
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true, isLoading: false })
    mockCopyToClipboard.mockClear()
  })

  it('masks the secret key by default and does not expose the full key', () => {
    customRender(<ApiKeyPill apiKey={secretKey} />)

    expect(screen.getByText(MASKED)).toBeInTheDocument()
    expect(screen.queryByText(FULL.slice(15))).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reveal API key' })).toBeInTheDocument()
  })

  it('reveals the full secret key when the reveal button is clicked', async () => {
    mockRevealById()
    customRender(<ApiKeyPill apiKey={secretKey} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reveal API key' }))

    expect(await screen.findByText(FULL.slice(15))).toBeInTheDocument()
  })

  it('copies the full secret key to the clipboard', async () => {
    mockRevealById()
    customRender(<ApiKeyPill apiKey={secretKey} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy API key' }))

    await waitFor(() => expect(mockCopyToClipboard).toHaveBeenCalledTimes(1))
    await expect(Promise.resolve(mockCopyToClipboard.mock.calls[0][0])).resolves.toBe(FULL)
  })
})
