import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { ProfileContextType } from '@/lib/profile'
import { CliLoginScreen } from '@/pages/cli/login'
import { customRender } from '@/tests/lib/custom-render'

const { createCliLoginSessionMock } = vi.hoisted(() => ({
  createCliLoginSessionMock: vi.fn(),
}))

vi.mock('@/data/cli/login', () => ({
  createCliLoginSession: createCliLoginSessionMock,
}))

const DEFAULT_PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'test@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

function renderScreen(props: Partial<Parameters<typeof CliLoginScreen>[0]> = {}) {
  const navigate = vi.fn()
  const result = customRender(
    <CliLoginScreen
      isLoggedIn
      routerReady
      sessionId="session-test"
      publicKey="public-key-test"
      tokenName="local-dev"
      navigate={navigate}
      {...props}
    />,
    { profileContext: DEFAULT_PROFILE_CONTEXT }
  )
  return { ...result, navigate }
}

describe('CliLoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('creates a session and routes to the device code', async () => {
    createCliLoginSessionMock.mockResolvedValue({ nonce: 'ABCDEFGH12345678' })
    const { navigate } = renderScreen()

    await waitFor(() => {
      expect(createCliLoginSessionMock).toHaveBeenCalledWith(
        'session-test',
        'public-key-test',
        'local-dev'
      )
    })
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/cli/login?device_code=ABCDEFGH')
    })
  })

  test('renders ready state with verification code and copy control', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn()
    vi.spyOn(window.document, 'hasFocus').mockReturnValue(true)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const { container } = renderScreen({ deviceCode: 'ZXCV9876' })

    expect(container).toHaveTextContent('ZXCV9876')
    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith('ZXCV9876')
  })

  test('copies selected verification code as a single string', () => {
    renderScreen({ deviceCode: 'ZXCV9876' })

    const clipboardData = { setData: vi.fn() }
    const code = screen.getByLabelText('Verification code ZXCV9876')
    const copyEvent = new Event('copy', { bubbles: true })

    Object.defineProperty(copyEvent, 'clipboardData', {
      value: clipboardData,
    })
    code.dispatchEvent(copyEvent)

    expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'ZXCV9876')
  })

  test('renders missing-params state without redirecting away', () => {
    renderScreen({ sessionId: undefined })

    expect(screen.getByText('Missing sign-in parameters')).toBeInTheDocument()
    expect(screen.getByText(/session_id/)).toBeInTheDocument()
  })

  test('renders creation error state in the card', async () => {
    createCliLoginSessionMock.mockRejectedValue(new Error('Session expired'))
    renderScreen()

    expect(await screen.findByText('Unable to create CLI sign-in')).toBeInTheDocument()
    expect(screen.getByText(/Session expired/)).toBeInTheDocument()
  })
})
