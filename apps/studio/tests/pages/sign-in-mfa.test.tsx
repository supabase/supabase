import { AuthError, AuthRetryableFetchError, type Session } from '@supabase/supabase-js'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Toaster } from 'sonner'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { BASE_PATH } from '@/lib/constants'
import { auth } from '@/lib/gotrue'
import SignInMfaPage from '@/pages/sign-in-mfa'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => ({}) }
})

const CALLBACK_ERROR = new AuthError('Test')
const SESSION: Session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'user-id',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
  },
}

function setUrl(url: string) {
  window.history.replaceState(null, '', url)
  routerMock.setCurrentUrl(url)
}

function mockAuth({
  initializeError = null,
  session = null,
  currentLevel = 'aal1',
}: {
  initializeError?: AuthError | null
  session?: Session | null
  currentLevel?: 'aal1' | 'aal2'
}) {
  vi.spyOn(auth, 'initialize').mockResolvedValue({ error: initializeError })
  vi.spyOn(auth, 'getSession').mockResolvedValue(
    session ? { data: { session }, error: null } : { data: { session: null }, error: null }
  )
  vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
    data: { currentLevel, nextLevel: 'aal2', currentAuthenticationMethods: [] },
    error: null,
  })
  vi.spyOn(auth.mfa, 'listFactors').mockResolvedValue({
    data: { all: [], totp: [], phone: [], webauthn: [], recovery_code: [] },
    error: null,
  })
}

function mockAuditLogin() {
  const onAuditLogin = vi.fn()
  addAPIMock({
    method: 'post',
    path: '/platform/profile/audit-login',
    response: () => {
      onAuditLogin()
      return new HttpResponse(null, { status: 201 })
    },
  })
  return onAuditLogin
}

describe('SignInMfaPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setUrl('/sign-in-mfa?method=github&returnTo=%2Forg')
  })

  test('returns to sign-in with the query when the callback failed and there is no session', async () => {
    mockAuth({ initializeError: CALLBACK_ERROR })
    customRender(<SignInMfaPage dehydratedState={undefined} />)

    await waitFor(() => expect(routerMock.pathname).toBe('/sign-in'))
    expect(routerMock.query).toEqual({ method: 'github', returnTo: '/org' })
  })

  test('shows the MFA form when a session exists despite an earlier callback error', async () => {
    mswServer.use(
      http.get(`${BASE_PATH}/api/enabled-features-overrides`, () =>
        HttpResponse.json({ disabled_features: [] })
      )
    )
    mockAuth({ initializeError: CALLBACK_ERROR, session: SESSION })
    customRender(<SignInMfaPage dehydratedState={undefined} />)

    expect(await screen.findByText('Two-factor authentication')).toBeInTheDocument()
    expect(routerMock.pathname).toBe('/sign-in-mfa')
  })

  test('returns to sign-in quietly when the stored session cannot refresh', async () => {
    mockAuth({ initializeError: CALLBACK_ERROR })
    vi.spyOn(auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: new AuthRetryableFetchError('unavailable', 503),
    })
    customRender(
      <>
        <SignInMfaPage dehydratedState={undefined} />
        <Toaster />
      </>
    )

    await waitFor(() => expect(routerMock.pathname).toBe('/sign-in'))
    expect(routerMock.query).toEqual({ method: 'github', returnTo: '/org' })
    expect(screen.queryByText(/Failed to initialize authentication/)).not.toBeInTheDocument()
  })

  test('returns to sign-in when there is no session', async () => {
    mockAuth({})
    customRender(<SignInMfaPage dehydratedState={undefined} />)

    await waitFor(() => expect(routerMock.pathname).toBe('/sign-in'))
    expect(routerMock.query).toEqual({ method: 'github', returnTo: '/org' })
  })

  test('records the sign-in and continues when the session is already at AAL2', async () => {
    const onAuditLogin = mockAuditLogin()
    mockAuth({ session: SESSION, currentLevel: 'aal2' })
    customRender(<SignInMfaPage dehydratedState={undefined} />)

    await waitFor(() => expect(routerMock.pathname).toBe('/org'))
    await waitFor(() => expect(onAuditLogin).toHaveBeenCalled())
  })

  test('continues without recording a sign-in when an AAL2 session outlived a failed callback', async () => {
    const onAuditLogin = mockAuditLogin()
    mockAuth({ initializeError: CALLBACK_ERROR, session: SESSION, currentLevel: 'aal2' })
    customRender(<SignInMfaPage dehydratedState={undefined} />)

    await waitFor(() => expect(routerMock.pathname).toBe('/org'))
    expect(onAuditLogin).not.toHaveBeenCalled()
  })
})
