import { describe, expect, test, vi } from 'vitest'

import { SignInPartner } from '@/components/interfaces/SignIn/SignInPartner'
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

describe('SignInPartner', () => {
  test('does not navigate after unmounting before sign-in resolves', async () => {
    const { auth } = await import('@/lib/gotrue')

    let resolveSignIn: () => void = () => {}
    vi.mocked(auth.getSession).mockResolvedValue({ data: { session: null } } as any)
    vi.mocked(auth.signInWithIdToken).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = () => resolve({} as any)
        })
    )

    window.location.hash = '#partner=google&id_token=test-token'

    const { unmount } = customRender(<SignInPartner />)

    unmount()
    resolveSignIn()

    // flush the pending microtasks from the resolved sign-in promise
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(routerReplaceMock).not.toHaveBeenCalled()
  })
})
