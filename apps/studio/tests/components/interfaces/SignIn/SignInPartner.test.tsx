import { waitFor } from '@testing-library/dom'
import { describe, expect, test, vi } from 'vitest'

import { SignInPartner } from '@/components/interfaces/SignIn/SignInPartner'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

const routerReplaceMock = vi.fn()

vi.mock('next/router', () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
  }),
}))

vi.mock('@/lib/gotrue', () => ({
  auth: {
    getSession: vi.fn(),
    signInWithIdToken: vi.fn(),
  },
}))

type GetSessionResult = Awaited<ReturnType<typeof auth.getSession>>
type SignInWithIdTokenResult = Awaited<ReturnType<typeof auth.signInWithIdToken>>

describe('SignInPartner', () => {
  test('does not redirect if the component unmounts before sign-in resolves', async () => {
    let resolveSignIn: (value: SignInWithIdTokenResult) => void = () => {}

    vi.mocked(auth.getSession).mockResolvedValue({
      data: { session: null },
    } as GetSessionResult)
    vi.mocked(auth.signInWithIdToken).mockImplementation(
      () => new Promise<SignInWithIdTokenResult>((resolve) => (resolveSignIn = resolve))
    )

    window.location.hash = '#partner=github&id_token=test-token'

    const { unmount } = customRender(<SignInPartner />)

    // Wait until the component has actually kicked off the sign-in exchange -
    // otherwise unmounting here proves nothing, since router.replace was never
    // going to be reachable yet regardless of the mount guard.
    await waitFor(() => {
      expect(auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'github',
        token: 'test-token',
      })
    })

    unmount()

    // Resolve the pending sign-in after the component has already unmounted -
    // this is the exact race the guard needs to catch.
    resolveSignIn({ data: { session: null, user: null }, error: null } as SignInWithIdTokenResult)

    // Flush the microtasks queued by the resolved promise so the effect's
    // `finally` block runs before we assert.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(routerReplaceMock).not.toHaveBeenCalled()
  })

  test('still redirects normally when the component stays mounted', async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      data: { session: null },
    } as GetSessionResult)
    vi.mocked(auth.signInWithIdToken).mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    } as SignInWithIdTokenResult)

    window.location.hash = '#partner=github&id_token=test-token'

    customRender(<SignInPartner />)

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledWith({
        pathname: '/sign-in-mfa',
        query: { method: 'github' },
      })
    })
  })
})
