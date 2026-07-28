import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { SessionsAuthSettingsForm } from './SessionsAuthSettingsForm'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// FormMessage animates via framer-motion, which relies on the Web Animations API.
mockAnimationsApi()

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, IS_PLATFORM: true }
})

vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: () => ({ hasAccess: true, isLoading: false }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isLoading: false, isSuccess: true }),
}))

function mockAuthConfig(overrides: Record<string, unknown> = {}) {
  addAPIMock({
    method: 'get',
    path: '/platform/auth/:ref/config',
    response: () =>
      HttpResponse.json<any>({
        JWT_EXP: 3600,
        REFRESH_TOKEN_ROTATION_ENABLED: true,
        SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 10,
        SESSIONS_TIMEBOX: 0,
        SESSIONS_INACTIVITY_TIMEOUT: 0,
        SESSIONS_SINGLE_PER_USER: false,
        ...overrides,
      }),
  })
}

function mockUpdateAuthConfig(onPatch?: (body: unknown) => void) {
  addAPIMock({
    method: 'patch',
    path: '/platform/auth/:ref/config',
    response: async ({ request }) => {
      const body = await request.json()
      onPatch?.(body)
      return HttpResponse.json<any>({ ...(body as object) })
    },
  })
}

describe('SessionsAuthSettingsForm — Access Tokens', () => {
  test('renders the access token expiry from the auth config', async () => {
    mockAuthConfig({ JWT_EXP: 3600 })

    customRender(<SessionsAuthSettingsForm />)

    expect(await screen.findByText('Access Tokens')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('3600')).toBeInTheDocument()
    expect(screen.getByText('Access token expiry time')).toBeInTheDocument()
  })

  test('saving a new expiry issues a PATCH with the JWT_EXP payload', async () => {
    mockAuthConfig({ JWT_EXP: 3600 })
    let patchBody: unknown
    mockUpdateAuthConfig((body) => {
      patchBody = body
    })

    customRender(<SessionsAuthSettingsForm />)

    const input = await screen.findByDisplayValue('3600')
    fireEvent.change(input, { target: { value: '7200' } })

    const form = input.closest('form') as HTMLFormElement
    const saveButton = within(form).getByRole('button', { name: 'Save changes' })
    await waitFor(() => expect(saveButton).toBeEnabled())
    fireEvent.click(saveButton)

    await waitFor(() => expect(patchBody).toEqual({ JWT_EXP: 7200 }))
  })

  test('blocks submit when the expiry exceeds the maximum', async () => {
    mockAuthConfig({ JWT_EXP: 3600 })
    let patchCalled = false
    mockUpdateAuthConfig(() => {
      patchCalled = true
    })

    customRender(<SessionsAuthSettingsForm />)

    const input = await screen.findByDisplayValue('3600')
    fireEvent.change(input, { target: { value: '999999' } })

    const form = input.closest('form') as HTMLFormElement
    const saveButton = within(form).getByRole('button', { name: 'Save changes' })
    await waitFor(() => expect(saveButton).toBeEnabled())
    fireEvent.click(saveButton)

    expect(await screen.findByText('Must be less than 604800')).toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })
})
