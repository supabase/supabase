import { SupportCategories } from '@supabase/shared-types/out/constants'
import { fireEvent, screen, waitForElementToBeRemoved, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext, LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { DeleteAccountButton } from './DeleteAccountButton'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfile, createMockProfileContext } from '@/tests/lib/profile-helpers'

mockAnimationsApi()

const profile = createMockProfile({ primary_email: 'account@example.com' })

function openDeletionDialog() {
  customRender(<DeleteAccountButton />, { profileContext: createMockProfileContext({ profile }) })
  fireEvent.click(screen.getByRole('button', { name: 'Request deletion' }))
  return within(screen.getByRole('dialog'))
}

describe('DeleteAccountButton', () => {
  afterEach(() => {
    safeLocalStorage.removeItem(LOCAL_STORAGE_KEYS.ACCOUNT_DELETION_REQUEST)
  })

  test('keeps the request form hidden until the organization check succeeds', async () => {
    const initialCheck = Promise.withResolvers<void>()
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: async () => {
        await initialCheck.promise
        return HttpResponse.json<APIErrorBody>({ message: 'Request failed' }, { status: 500 })
      },
    })

    const dialog = openDeletionDialog()
    expect(dialog.getByText('Checking your organization memberships…')).toBeVisible()
    expect(dialog.queryByRole('textbox')).not.toBeInTheDocument()

    initialCheck.resolve()
    const retry = await dialog.findByRole('button', { name: 'Retry' })
    expect(dialog.queryByRole('textbox')).not.toBeInTheDocument()

    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: [],
    })
    fireEvent.click(retry)
    const confirmation = await screen.findByRole('textbox', {
      name: `Type ${profile.primary_email} to confirm.`,
    })
    expect(confirmation).toHaveAttribute('placeholder', 'Type your email address in here')

    const requestDialog = within(screen.getByRole('dialog', { name: 'Request account deletion' }))
    const submit = requestDialog.getByRole('button', { name: 'Submit deletion request' })
    const submitSpy = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json<{ result: 'ok' }>({ result: 'ok' })
      },
    })

    fireEvent.change(confirmation, { target: { value: 'different@example.com' } })
    fireEvent.click(submit)
    expect(
      await requestDialog.findByText('Enter the email address shown above')
    ).toBeInTheDocument()
    expect(submitSpy).not.toHaveBeenCalled()

    fireEvent.change(confirmation, { target: { value: profile.primary_email } })
    fireEvent.click(submit)
    await waitForElementToBeRemoved(() =>
      screen.queryByRole('dialog', { name: 'Request account deletion' })
    )

    expect(submitSpy).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        subject: 'Account Deletion Request',
        message: 'I want to delete my account.',
        category: SupportCategories.ACCOUNT_DELETION,
        severity: 'Low',
        allowSupportAccess: false,
        verified: true,
      })
    )
  })

  test('copies the account email without changing the confirmation input', async () => {
    const user = userEvent.setup()
    addAPIMock({ method: 'get', path: '/platform/organizations', response: [] })

    customRender(
      <FeatureFlagContext.Provider
        value={{
          configcat: { textConfirmationModalClickToCopy: true },
          posthog: {},
          hasLoaded: true,
        }}
      >
        <DeleteAccountButton />
      </FeatureFlagContext.Provider>,
      { profileContext: createMockProfileContext({ profile }) }
    )
    await user.click(screen.getByRole('button', { name: 'Request deletion' }))
    const dialog = within(await screen.findByRole('dialog', { name: 'Request account deletion' }))
    const copy = await dialog.findByRole('button', { name: profile.primary_email })
    expect(copy).toHaveAttribute('type', 'button')
    const confirmation = dialog.getByRole('textbox')
    const draft = 'account@'
    await user.type(confirmation, draft)
    await user.click(copy)

    expect(await navigator.clipboard.readText()).toBe(profile.primary_email)
    expect(confirmation).toHaveValue(draft)
  })

  test('offers only dismissal when the account still belongs to an organization', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: [createMockOrganizationResponse()],
    })

    const dialog = openDeletionDialog()
    expect(
      await dialog.findByRole('heading', { name: 'Leave all organizations first' })
    ).toBeVisible()
    expect(dialog.queryByRole('textbox')).not.toBeInTheDocument()

    fireEvent.click(dialog.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
