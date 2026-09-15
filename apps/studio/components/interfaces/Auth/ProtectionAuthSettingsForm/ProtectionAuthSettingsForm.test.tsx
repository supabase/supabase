import { focusManager, QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { ProtectionAuthSettingsForm } from './ProtectionAuthSettingsForm'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// FormMessage animates via framer-motion, which relies on the Web Animations API.
mockAnimationsApi()

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, IS_PLATFORM: true }
})

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isLoading: false, isSuccess: true }),
}))

const baseAuthConfig = {
  DISABLE_SIGNUP: false,
  SITE_URL: 'https://example.com',
  SECURITY_CAPTCHA_ENABLED: true,
  SECURITY_CAPTCHA_PROVIDER: 'turnstile',
  SECURITY_CAPTCHA_SECRET: 'stored-secret',
  PASSWORD_MIN_LENGTH: 6,
}

/**
 * Serves a fresh auth config on every GET, so a refetch can return something
 * different from the initial load.
 */
function mockAuthConfig(configs: Array<Record<string, unknown>>) {
  let callCount = 0
  addAPIMock({
    method: 'get',
    path: '/platform/auth/:ref/config',
    response: () => {
      const config = configs[Math.min(callCount, configs.length - 1)]
      callCount += 1
      return HttpResponse.json<any>({ ...baseAuthConfig, ...config })
    },
  })
}

function mockUpdateAuthConfig(onPatch?: (body: unknown) => void) {
  addAPIMock({
    method: 'patch',
    path: '/platform/auth/:ref/config',
    response: async ({ request }) => {
      const body = await request.json()
      onPatch?.(body)
      return HttpResponse.json<any>({ ...baseAuthConfig, ...(body as object) })
    },
  })
}

// focusManager is global to react-query, so hand it back to its default detection
afterEach(() => focusManager.setFocused(undefined))

/** Stands in for the user tabbing away and back, which react-query refetches on. */
async function triggerWindowFocusRefetch(queryClient: QueryClient) {
  await act(async () => {
    focusManager.setFocused(false)
    focusManager.setFocused(true)
  })
  await waitFor(() => expect(queryClient.isFetching()).toBe(0))
}

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  customRender(<ProtectionAuthSettingsForm />, { queryClient })
  return queryClient
}

describe('ProtectionAuthSettingsForm — captcha secret', () => {
  test('keeps an edited captcha secret when a background refetch brings a change', async () => {
    mockAuthConfig([{}, { SITE_URL: 'https://changed-elsewhere.com' }])
    const queryClient = renderForm()

    const secretInput = await screen.findByDisplayValue('stored-secret')
    fireEvent.change(secretInput, { target: { value: 'my-new-turnstile-secret' } })

    await triggerWindowFocusRefetch(queryClient)

    expect(secretInput).toHaveValue('my-new-turnstile-secret')
  })

  test('keeps a cleared captcha secret when a background refetch brings a change', async () => {
    mockAuthConfig([{}, { SITE_URL: 'https://changed-elsewhere.com' }])
    const queryClient = renderForm()

    const secretInput = await screen.findByDisplayValue('stored-secret')
    fireEvent.change(secretInput, { target: { value: '' } })

    await triggerWindowFocusRefetch(queryClient)

    expect(secretInput).toHaveValue('')
  })

  test('still picks up a config changed elsewhere when the form has no edits', async () => {
    mockAuthConfig([{}, { SECURITY_CAPTCHA_SECRET: 'changed-in-another-tab' }])
    const queryClient = renderForm()

    await screen.findByDisplayValue('stored-secret')

    await triggerWindowFocusRefetch(queryClient)

    expect(await screen.findByDisplayValue('changed-in-another-tab')).toBeInTheDocument()
  })

  test('syncs a config that arrived during an edit once the edit is cancelled', async () => {
    mockAuthConfig([{}, { SECURITY_CAPTCHA_SECRET: 'changed-in-another-tab' }])
    const queryClient = renderForm()

    const secretInput = await screen.findByDisplayValue('stored-secret')
    fireEvent.change(secretInput, { target: { value: 'my-new-turnstile-secret' } })

    await triggerWindowFocusRefetch(queryClient)
    expect(secretInput).toHaveValue('my-new-turnstile-secret')

    const form = secretInput.closest('form') as HTMLFormElement
    fireEvent.click(within(form).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(secretInput).toHaveValue('changed-in-another-tab'))
  })

  test('sends the edited secret on save and settles clean afterwards', async () => {
    mockAuthConfig([{}])
    let patchBody: any
    mockUpdateAuthConfig((body) => {
      patchBody = body
    })
    const queryClient = renderForm()

    const secretInput = await screen.findByDisplayValue('stored-secret')
    fireEvent.change(secretInput, { target: { value: 'my-new-turnstile-secret' } })

    const form = secretInput.closest('form') as HTMLFormElement
    const saveButton = within(form).getByRole('button', { name: 'Save changes' })
    await waitFor(() => expect(saveButton).toBeEnabled())
    fireEvent.click(saveButton)

    await waitFor(() => expect(patchBody?.SECURITY_CAPTCHA_SECRET).toBe('my-new-turnstile-secret'))

    // Once saved the form is no longer dirty, so it is free to track the server again
    await waitFor(() => expect(saveButton).toBeDisabled())
    await triggerWindowFocusRefetch(queryClient)
  })
})
