import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { RateLimits } from './RateLimits'
import type { components } from '@/data/api'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type AuthConfigResponse = components['schemas']['GoTrueConfigResponse']

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, IS_PLATFORM: true }
})

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isLoading: false, isSuccess: true }),
}))

const BASE_CONFIG: Partial<AuthConfigResponse> = {
  EXTERNAL_EMAIL_ENABLED: true,
  SMTP_ADMIN_EMAIL: 'admin@example.com',
  SMTP_SENDER_NAME: 'Example',
  SMTP_USER: 'smtp-user',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PASS: 'stored-password-marker',
  SMTP_PORT: '587',
  RATE_LIMIT_TOKEN_REFRESH: 150,
  RATE_LIMIT_VERIFY: 30,
  RATE_LIMIT_EMAIL_SENT: 30,
  RATE_LIMIT_SMS_SENT: 30,
  RATE_LIMIT_ANONYMOUS_USERS: 30,
  RATE_LIMIT_OTP: 30,
  RATE_LIMIT_WEB3: 30,
}

function mockAuthConfig(overrides: Partial<AuthConfigResponse>) {
  let capturedPayload: Partial<AuthConfigResponse> | null = null
  addAPIMock({
    method: 'get',
    path: '/platform/auth/:ref/config',
    response: () =>
      HttpResponse.json<AuthConfigResponse>({ ...BASE_CONFIG, ...overrides } as AuthConfigResponse),
  })
  addAPIMock({
    method: 'patch',
    path: '/platform/auth/:ref/config',
    response: async ({ request }) => {
      capturedPayload = await request.json()
      return HttpResponse.json<AuthConfigResponse>({
        ...BASE_CONFIG,
        ...overrides,
        ...capturedPayload,
      } as AuthConfigResponse)
    },
  })
  return () => capturedPayload
}

describe('RateLimits — SMTP_MAX_FREQUENCY edge cases', () => {
  test('a stored value of 0 does not block saving an unrelated rate limit field', async () => {
    const getPayload = mockAuthConfig({ SMTP_MAX_FREQUENCY: 0 })

    customRender(<RateLimits />)

    const emailInput = await screen.findByLabelText('Rate limit for sending emails')
    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, '50')

    const saveButton = screen.getAllByRole('button', { name: 'Save changes' })[0]
    const formEl = saveButton.closest('form')
    fireEvent.submit(formEl!)

    await waitFor(() => {
      expect(getPayload()).not.toBeNull()
    })
    expect(getPayload()).toMatchObject({ RATE_LIMIT_EMAIL_SENT: 50 })
  })
})
