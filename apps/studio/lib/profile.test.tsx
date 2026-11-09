import { screen, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileProvider, useProfile } from './profile'
import type { ProfileResponse } from '@/data/profile/profile-create-mutation'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfile } from '@/tests/lib/profile-helpers'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
    useUser: () => ({ id: 'user-1', email: 'test@example.com' }),
    useIsLoggedIn: () => true,
  }
})

vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn(), captureException: vi.fn() }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

const profileResponse = (username?: string) =>
  HttpResponse.json<ProfileResponse>(createMockProfile({ username }))
const errorResponse = (message: string, status: number) =>
  HttpResponse.json<APIErrorBody>({ message }, { status })

const ProfileStatus = () => {
  const { profile, isSuccess } = useProfile()
  return <div>{isSuccess ? `profile:${profile?.username}` : 'no-profile'}</div>
}

const renderProvider = () =>
  customRender(
    <ProfileProvider>
      <ProfileStatus />
    </ProfileProvider>
  )

// Serves each GET response in order, repeating the last one
const mockProfileGet = (responses: Array<'not-found' | 'found'>) => {
  const getSpy = vi.fn()
  addAPIMock({
    method: 'get',
    path: '/platform/profile',
    response: () => {
      const next = responses[Math.min(getSpy.mock.calls.length, responses.length - 1)]
      getSpy()
      return next === 'found'
        ? profileResponse('new-user')
        : errorResponse("User's profile not found", 404)
    },
  })
  return getSpy
}

describe('ProfileProvider profile creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the profile once when it does not exist', async () => {
    const getSpy = mockProfileGet(['not-found', 'found'])
    const postSpy = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/profile',
      response: () => {
        postSpy()
        return profileResponse()
      },
    })

    renderProvider()

    await waitFor(() => expect(screen.getByText('profile:new-user')).toBeInTheDocument())
    expect(postSpy).toHaveBeenCalledTimes(1)
    expect(getSpy).toHaveBeenCalledTimes(2)
  })

  it('refetches the profile when creation returns 409', async () => {
    mockProfileGet(['not-found', 'found'])
    const postSpy = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/profile',
      response: () => {
        postSpy()
        return errorResponse('Profile already exists', 409)
      },
    })

    renderProvider()

    await waitFor(() => expect(screen.getByText('profile:new-user')).toBeInTheDocument())
    expect(postSpy).toHaveBeenCalledTimes(1)
  })

  it('does not loop POSTing when the profile is still not found after a 409', async () => {
    const getSpy = mockProfileGet(['not-found'])
    const postSpy = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/profile',
      response: () => {
        postSpy()
        return errorResponse('Profile already exists', 409)
      },
    })

    renderProvider()

    // Initial GET, then the refetch triggered by the 409
    await waitFor(() => expect(getSpy).toHaveBeenCalledTimes(2))
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(postSpy).toHaveBeenCalledTimes(1)
    expect(getSpy).toHaveBeenCalledTimes(2)
  })

  it('retries creation on a server error', async () => {
    mockProfileGet(['not-found', 'found'])
    const postSpy = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/profile',
      response: () => {
        postSpy()
        return postSpy.mock.calls.length === 1
          ? errorResponse('Internal error', 500)
          : profileResponse()
      },
    })

    renderProvider()

    await waitFor(() => expect(screen.getByText('profile:new-user')).toBeInTheDocument(), {
      timeout: 5000,
    })
    expect(postSpy).toHaveBeenCalledTimes(2)
  })
})
