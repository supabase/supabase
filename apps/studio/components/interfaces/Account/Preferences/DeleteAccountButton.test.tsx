import { fireEvent, screen, within } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { DeleteAccountButton } from './DeleteAccountButton'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfile, createMockProfileContext } from '@/tests/lib/profile-helpers'

mockAnimationsApi()

const profile = createMockProfile({ primary_email: 'account@example.com' })

function openDeletionDialog() {
  customRender(<DeleteAccountButton />, { profileContext: createMockProfileContext({ profile }) })
  fireEvent.click(screen.getByRole('button', { name: 'Request account deletion' }))
  return within(screen.getByRole('dialog'))
}

describe('DeleteAccountButton', () => {
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
    const email = await dialog.findByRole('textbox', {
      name: 'Enter your email address to confirm',
    })
    const submit = dialog.getByRole('button', { name: 'Submit deletion request' })
    expect(submit).toBeDisabled()

    fireEvent.change(email, {
      target: { value: profile.primary_email },
    })
    expect(submit).toBeEnabled()
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
