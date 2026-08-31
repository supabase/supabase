import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BasicAuthSettingsForm } from './BasicAuthSettingsForm'
import { ProtectionAuthSettingsForm } from './ProtectionAuthSettingsForm/ProtectionAuthSettingsForm'
import type { AuthConfigResponse } from '@/data/auth/auth-config-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isLoading: false, isSuccess: true }),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => false,
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
} as unknown as AuthConfigResponse

function mockUpdateAuthConfig(requests: unknown[]) {
  addAPIMock({
    method: 'patch',
    path: '/platform/auth/:ref/config',
    response: async ({ request }) => {
      const body = await request.json()
      requests.push(body)

      return HttpResponse.json<AuthConfigResponse>({
        ...authConfig,
        ...(body as object),
      } as AuthConfigResponse)
    },
  })
}

describe('auth settings form payload isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: () => HttpResponse.json<AuthConfigResponse>(authConfig),
    })
  })

  it('does not submit SITE_URL when saving user signup settings', async () => {
    const user = userEvent.setup()
    const requests: unknown[] = []
    mockUpdateAuthConfig(requests)

    customRender(<BasicAuthSettingsForm />)

    await user.click(await screen.findByRole('switch', { name: 'Allow new users to sign up' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toEqual({
      DISABLE_SIGNUP: true,
      EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
      SECURITY_MANUAL_LINKING_ENABLED: false,
      MAILER_AUTOCONFIRM: false,
    })
  })

  it('does not submit SITE_URL when saving protection settings', async () => {
    const user = userEvent.setup()
    const requests: unknown[] = []
    mockUpdateAuthConfig(requests)

    customRender(<ProtectionAuthSettingsForm />)

    await user.click(await screen.findByRole('switch', { name: 'Enable Captcha protection' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toEqual({
      DISABLE_SIGNUP: false,
      EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
      SECURITY_MANUAL_LINKING_ENABLED: false,
      SECURITY_CAPTCHA_ENABLED: false,
      SECURITY_CAPTCHA_SECRET: 'existing-secret',
      SECURITY_CAPTCHA_PROVIDER: 'hcaptcha',
      PASSWORD_MIN_LENGTH: 6,
      PASSWORD_REQUIRED_CHARACTERS: '',
      PASSWORD_HIBP_ENABLED: false,
    })
  })
})
