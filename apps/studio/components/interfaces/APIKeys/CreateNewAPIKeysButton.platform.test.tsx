import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateNewAPIKeysButton } from './CreateNewAPIKeysButton'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

// Responds to each create request in order: `true` succeeds, `false` fails
function mockCreateResponses(results: boolean[]) {
  const remaining = [...results]
  addAPIMock({
    method: 'post',
    path: '/v1/projects/:ref/api-keys',
    response: () => {
      const succeeds = remaining.shift() ?? false
      if (!succeeds) {
        return HttpResponse.json<APIErrorBody>({ message: 'Failed' }, { status: 500 })
      }
      return HttpResponse.json<ApiKeyResponse>({
        id: 'key',
        name: 'default',
        type: 'publishable',
        api_key: 'sb_publishable_xyz',
      })
    },
  })
}

async function createKeys() {
  customRender(<CreateNewAPIKeysButton />, { profileContext: createMockProfileContext() })
  const trigger = await screen.findByRole('button', { name: 'Create new API keys' })
  await waitFor(() => expect(trigger).toBeEnabled())
  await userEvent.click(trigger)
  await userEvent.click(await screen.findByRole('button', { name: 'Create keys' }))
}

describe('CreateNewAPIKeysButton tracking', () => {
  beforeEach(() => {
    mockTrack.mockClear()
    mockProjectGrantContext({ ref: 'default' })
  })

  it('tracks the publishable and secret key separately when both are created', async () => {
    mockCreateResponses([true, true])
    await createKeys()

    await waitFor(() => expect(mockTrack).toHaveBeenCalledTimes(2))
    expect(mockTrack).toHaveBeenNthCalledWith(
      1,
      'api_key_created',
      { keyType: 'publishable', source: 'initial_setup' },
      { project: 'default' }
    )
    expect(mockTrack).toHaveBeenNthCalledWith(
      2,
      'api_key_created',
      { keyType: 'secret', source: 'initial_setup' },
      { project: 'default' }
    )
  })

  it('still tracks the publishable key when the secret key fails', async () => {
    mockCreateResponses([true, false])
    await createKeys()

    expect(await screen.findByText(/default secret key failed/)).toBeInTheDocument()
    expect(mockTrack).toHaveBeenCalledTimes(1)
    expect(mockTrack).toHaveBeenCalledWith(
      'api_key_created',
      { keyType: 'publishable', source: 'initial_setup' },
      { project: 'default' }
    )
  })

  it('tracks nothing when the publishable key fails', async () => {
    mockCreateResponses([false])
    await createKeys()

    expect(
      await screen.findByText(/Failed to create the default publishable key/)
    ).toBeInTheDocument()
    expect(mockTrack).not.toHaveBeenCalled()
  })
})
