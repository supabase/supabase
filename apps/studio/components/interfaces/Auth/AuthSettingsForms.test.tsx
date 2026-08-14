import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BasicAuthSettingsForm } from './BasicAuthSettingsForm'
import { ProtectionAuthSettingsForm } from './ProtectionAuthSettingsForm/ProtectionAuthSettingsForm'
import { render } from '@/tests/helpers'

const {
  updateAuthConfigMock,
  useAuthConfigQueryMock,
  useAuthConfigUpdateMutationMock,
  useAsyncCheckPermissionsMock,
  useIsFeatureEnabledMock,
} = vi.hoisted(() => ({
  updateAuthConfigMock: vi.fn(),
  useAuthConfigQueryMock: vi.fn(),
  useAuthConfigUpdateMutationMock: vi.fn(),
  useAsyncCheckPermissionsMock: vi.fn(),
  useIsFeatureEnabledMock: vi.fn(),
}))

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    useParams: vi.fn().mockReturnValue({ ref: 'project-ref' }),
  }
})

vi.mock('@/data/auth/auth-config-query', () => ({
  useAuthConfigQuery: useAuthConfigQueryMock,
}))

vi.mock('@/data/auth/auth-config-update-mutation', () => ({
  useAuthConfigUpdateMutation: useAuthConfigUpdateMutationMock,
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: useAsyncCheckPermissionsMock,
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: useIsFeatureEnabledMock,
}))

const authConfig = {
  DISABLE_SIGNUP: false,
  EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
  SECURITY_MANUAL_LINKING_ENABLED: false,
  MAILER_AUTOCONFIRM: false,
  SITE_URL: 'https://current.example.com',
  SECURITY_CAPTCHA_ENABLED: true,
  SECURITY_CAPTCHA_SECRET: 'existing-secret',
  SECURITY_CAPTCHA_PROVIDER: 'hcaptcha',
  SESSIONS_TIMEBOX: 0,
  SESSIONS_INACTIVITY_TIMEOUT: 0,
  SESSIONS_SINGLE_PER_USER: false,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_REQUIRED_CHARACTERS: '',
  PASSWORD_HIBP_ENABLED: false,
}

describe('auth settings form payload isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useAuthConfigQueryMock.mockReturnValue({
      data: authConfig,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
    })
    useAuthConfigUpdateMutationMock.mockReturnValue({
      mutate: updateAuthConfigMock,
      isPending: false,
    })
    useAsyncCheckPermissionsMock.mockReturnValue({ can: true, isSuccess: true })
    useIsFeatureEnabledMock.mockReturnValue(false)
  })

  it('does not submit SITE_URL when saving user signup settings', async () => {
    const user = userEvent.setup()

    render(<BasicAuthSettingsForm />)

    await user.click(await screen.findByRole('switch', { name: 'Allow new users to sign up' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updateAuthConfigMock).toHaveBeenCalledTimes(1))

    expect(updateAuthConfigMock.mock.calls[0][0]).toEqual({
      projectRef: 'project-ref',
      config: {
        DISABLE_SIGNUP: true,
        EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
        SECURITY_MANUAL_LINKING_ENABLED: false,
        MAILER_AUTOCONFIRM: false,
      },
    })
  })

  it('does not submit SITE_URL when saving protection settings', async () => {
    const user = userEvent.setup()

    render(<ProtectionAuthSettingsForm />)

    await user.click(await screen.findByRole('switch', { name: 'Enable Captcha protection' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updateAuthConfigMock).toHaveBeenCalledTimes(1))

    expect(updateAuthConfigMock.mock.calls[0][0]).toEqual({
      projectRef: 'project-ref',
      config: {
        DISABLE_SIGNUP: false,
        EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
        SECURITY_MANUAL_LINKING_ENABLED: false,
        SECURITY_CAPTCHA_ENABLED: false,
        SECURITY_CAPTCHA_SECRET: 'existing-secret',
        SECURITY_CAPTCHA_PROVIDER: 'hcaptcha',
        SESSIONS_TIMEBOX: 0,
        SESSIONS_INACTIVITY_TIMEOUT: 0,
        SESSIONS_SINGLE_PER_USER: false,
        PASSWORD_MIN_LENGTH: 6,
        PASSWORD_REQUIRED_CHARACTERS: '',
        PASSWORD_HIBP_ENABLED: false,
      },
    })
  })
})
