import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { SessionsAuthSettingsForm } from './SessionsAuthSettingsForm'
import {
  MAX_REFRESH_TOKEN_REUSE_INTERVAL_MESSAGE,
  MAX_SESSIONS_INACTIVITY_TIMEOUT_MESSAGE,
  MAX_SESSIONS_TIMEBOX_HOURS,
  MAX_SESSIONS_TIMEBOX_MESSAGE,
} from './SessionsAuthSettingsForm.utils'
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

async function saveForm(control: HTMLElement) {
  const form = control.closest('form') as HTMLFormElement
  const saveButton = within(form).getByRole('button', { name: 'Save changes' })
  await waitFor(() => expect(saveButton).toBeEnabled())
  fireEvent.click(saveButton)
}

describe('SessionsAuthSettingsForm — User Sessions', () => {
  test('blocks submit when the timebox exceeds the maximum', async () => {
    mockAuthConfig({ SESSIONS_TIMEBOX: 0 })
    let patchCalled = false
    mockUpdateAuthConfig(() => {
      patchCalled = true
    })

    customRender(<SessionsAuthSettingsForm />)

    const input = await screen.findByLabelText('Time-box user sessions')
    fireEvent.change(input, { target: { value: '9000' } })
    await saveForm(input)

    expect(await screen.findByText(MAX_SESSIONS_TIMEBOX_MESSAGE)).toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })

  test('accepts a timebox at the maximum', async () => {
    mockAuthConfig({ SESSIONS_TIMEBOX: 0 })
    let patchBody: any
    mockUpdateAuthConfig((body) => {
      patchBody = body
    })

    customRender(<SessionsAuthSettingsForm />)

    const input = await screen.findByLabelText('Time-box user sessions')
    fireEvent.change(input, { target: { value: String(MAX_SESSIONS_TIMEBOX_HOURS) } })
    await saveForm(input)

    await waitFor(() => expect(patchBody?.SESSIONS_TIMEBOX).toBe(MAX_SESSIONS_TIMEBOX_HOURS))
  })

  test('saves an over-limit timebox that is already stored', async () => {
    mockAuthConfig({ SESSIONS_TIMEBOX: 20000 })
    let patchBody: any
    mockUpdateAuthConfig((body) => {
      patchBody = body
    })

    customRender(<SessionsAuthSettingsForm />)

    // Save is gated on isDirty, so change an unrelated field in the same card
    const singleSessionSwitch = await screen.findByLabelText('Enforce single session per user')
    fireEvent.click(singleSessionSwitch)
    await saveForm(singleSessionSwitch)

    await waitFor(() => expect(patchBody?.SESSIONS_TIMEBOX).toBe(20000))
    expect(patchBody?.SESSIONS_SINGLE_PER_USER).toBe(true)
  })

  test('blocks a reduction that is still above the maximum', async () => {
    mockAuthConfig({ SESSIONS_TIMEBOX: 20000 })
    let patchCalled = false
    mockUpdateAuthConfig(() => {
      patchCalled = true
    })

    customRender(<SessionsAuthSettingsForm />)

    const input = await screen.findByLabelText('Time-box user sessions')
    fireEvent.change(input, { target: { value: '15000' } })
    await saveForm(input)

    expect(await screen.findByText(MAX_SESSIONS_TIMEBOX_MESSAGE)).toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })

  test('saves a reduction into the allowed range', async () => {
    mockAuthConfig({ SESSIONS_TIMEBOX: 20000 })
    let patchBody: any
    mockUpdateAuthConfig((body) => {
      patchBody = body
    })

    customRender(<SessionsAuthSettingsForm />)

    const input = await screen.findByLabelText('Time-box user sessions')
    fireEvent.change(input, { target: { value: '5000' } })
    await saveForm(input)

    await waitFor(() => expect(patchBody?.SESSIONS_TIMEBOX).toBe(5000))
  })

  test('blocks submit when the inactivity timeout exceeds the maximum', async () => {
    mockAuthConfig({ SESSIONS_INACTIVITY_TIMEOUT: 0 })
    let patchCalled = false
    mockUpdateAuthConfig(() => {
      patchCalled = true
    })

    customRender(<SessionsAuthSettingsForm />)

    const input = await screen.findByLabelText('Inactivity timeout')
    fireEvent.change(input, { target: { value: '10000' } })
    await saveForm(input)

    expect(await screen.findByText(MAX_SESSIONS_INACTIVITY_TIMEOUT_MESSAGE)).toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })
})

describe('SessionsAuthSettingsForm — Refresh Tokens', () => {
  test('blocks submit when the reuse interval exceeds the maximum', async () => {
    mockAuthConfig({ SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 10 })
    let patchCalled = false
    mockUpdateAuthConfig(() => {
      patchCalled = true
    })

    customRender(<SessionsAuthSettingsForm />)

    const input = await screen.findByLabelText('Refresh token reuse interval')
    fireEvent.change(input, { target: { value: '600' } })
    await saveForm(input)

    expect(await screen.findByText(MAX_REFRESH_TOKEN_REUSE_INTERVAL_MESSAGE)).toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })

  test('saves an over-limit reuse interval that is already stored', async () => {
    mockAuthConfig({ SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 600 })
    let patchBody: any
    mockUpdateAuthConfig((body) => {
      patchBody = body
    })

    customRender(<SessionsAuthSettingsForm />)

    const rotationSwitch = await screen.findByLabelText(
      'Detect and revoke potentially compromised refresh tokens'
    )
    fireEvent.click(rotationSwitch)
    await saveForm(rotationSwitch)

    await waitFor(() => expect(patchBody?.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL).toBe(600))
  })

  test('saves a reduction into the allowed range', async () => {
    mockAuthConfig({ SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 600 })
    let patchBody: any
    mockUpdateAuthConfig((body) => {
      patchBody = body
    })

    customRender(<SessionsAuthSettingsForm />)

    const input = await screen.findByLabelText('Refresh token reuse interval')
    fireEvent.change(input, { target: { value: '10' } })
    await saveForm(input)

    await waitFor(() => expect(patchBody?.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL).toBe(10))
  })
})
