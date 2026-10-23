import { AuthError } from '@supabase/auth-js'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFlag } from 'common'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { RecoveryReminder } from '@/components/interfaces/Account/RecoveryInterstitial/RecoveryInterstitial'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useFlag: vi.fn(() => false), useParams: () => ({ ref: 'default' }) }
})

async function enrollFactor() {
  vi.spyOn(auth.mfa, 'enroll').mockResolvedValue({
    data: {
      id: 'backup-factor',
      type: 'totp',
      friendly_name: 'Backup',
      totp: { qr_code: 'data:image/svg+xml,<svg/>', secret: 'test', uri: 'otpauth://test' },
    },
    error: null,
  })
  await userEvent.type(screen.getByRole('textbox', { name: 'Authenticator app name' }), 'Backup')
  fireEvent.click(screen.getByRole('button', { name: 'Generate QR' }))
  await screen.findByText('Verify new factor Backup')
}

async function verifyFactor() {
  vi.spyOn(auth.mfa, 'challengeAndVerify').mockResolvedValue({
    data: {
      access_token: 'test',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'test',
      user: {
        id: 'user',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: '2026-01-01T00:00:00Z',
      },
    },
    error: null,
  })
  await userEvent.type(screen.getByRole('textbox', { name: 'Authentication code' }), '123456')
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  await screen.findByText('Backup authenticator added')
}

const response = {
  data: {
    id: 'codes',
    type: 'recovery_code' as const,
    total: 1,
    codes: ['wto24t5xbeulvjmi'],
  },
  error: null,
}

async function acknowledgeCodes() {
  const dialog = within(screen.getByRole('dialog'))
  expect(dialog.getByRole('button', { name: 'Done' })).toBeDisabled()
  fireEvent.click(
    dialog.getByRole('checkbox', { name: 'I have saved my recovery codes somewhere safe' })
  )
  fireEvent.click(dialog.getByRole('button', { name: 'Done' }))
}

async function confirmRegeneration() {
  const dialog = await screen.findByRole('dialog')
  await userEvent.type(
    within(dialog).getByRole('textbox', { name: /Type REGENERATE to confirm/ }),
    'REGENERATE'
  )
  fireEvent.click(within(dialog).getByRole('button', { name: 'Regenerate' }))
}

describe('RecoveryReminder', () => {
  test('does not claim success when checks are disabled', () => {
    customRender(<RecoveryReminder gap={null} destination="/organizations" isUnavailable />)
    expect(
      screen.getByRole('heading', { name: 'Account recovery check unavailable' })
    ).toBeInTheDocument()
    expect(screen.queryByText('You’re all set')).not.toBeInTheDocument()
  })

  beforeEach(() => vi.mocked(useFlag).mockReturnValue(false))
  test('shimmers while checking and hides Continue until resolved', () => {
    const { rerender } = customRender(
      <RecoveryReminder gap={null} destination="/organizations" isLoading />
    )
    expect(screen.getByRole('status', { name: 'Checking account recovery' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Continue' })).not.toBeInTheDocument()
    expect(screen.queryByText('You’re all set')).not.toBeInTheDocument()
    rerender(<RecoveryReminder gap={null} destination="/organizations" />)
    expect(screen.getByRole('link', { name: 'Continue' })).toBeInTheDocument()
    expect(
      screen.queryByRole('status', { name: 'Checking account recovery' })
    ).not.toBeInTheDocument()
  })

  test('shows the resolved state and preserves the return destination', () => {
    customRender(<RecoveryReminder gap={null} destination="/organizations?view=all" />)
    expect(screen.getByRole('heading', { name: 'You’re all set' })).toBeInTheDocument()
    expect(screen.getByText('No account recovery reminder is available.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute(
      'href',
      '/organizations?view=all'
    )
  })

  test('completes optional authenticator independently and preserves codes task on cancellation', async () => {
    vi.spyOn(auth.mfa, 'unenroll').mockResolvedValue({ data: { id: 'backup-factor' }, error: null })
    vi.spyOn(auth.mfa.recoveryCodes, 'generate').mockResolvedValue(response)
    const { rerender } = customRender(
      <RecoveryReminder gap="missing" destination="/organizations" hasAuthenticatorTask />
    )
    expect(screen.getByRole('link', { name: 'Skip for now' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add authenticator' }))
    await enrollFactor()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Add authenticator' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate codes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add authenticator' }))
    await enrollFactor()
    rerender(<RecoveryReminder gap={null} destination="/organizations" hasAuthenticatorTask />)
    await verifyFactor()
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate codes' })).toBeInTheDocument()
    expect(screen.queryByText('Recovery codes saved')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Generate codes' }))
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')
    await acknowledgeCodes()
    await screen.findByText('Recovery codes saved')
    expect(screen.getAllByRole('button', { name: 'Done' })).toHaveLength(2)
    screen.getAllByRole('button', { name: 'Done' }).forEach((button) => {
      expect(button).toBeDisabled()
    })
  })

  test('reports actions, acknowledged completion, and exit state', async () => {
    vi.spyOn(auth.mfa.recoveryCodes, 'generate').mockResolvedValue(response)
    const onAction = vi.fn()
    const onTaskComplete = vi.fn()
    const onExit = vi.fn()
    customRender(
      <RecoveryReminder
        gap="missing"
        destination="/organizations"
        hasAuthenticatorTask={false}
        onAction={onAction}
        onTaskComplete={onTaskComplete}
        onExit={onExit}
      />
    )
    fireEvent.click(screen.getByRole('link', { name: 'Skip for now' }))
    expect(onExit).toHaveBeenLastCalledWith({
      gap: 'missing',
      areCodesSaved: false,
      isFactorComplete: false,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Generate codes' }))
    expect(onAction).toHaveBeenCalledWith('generate_codes')
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')
    expect(screen.getByRole('link', { name: /Account Security/ })).toHaveAttribute(
      'target',
      '_blank'
    )
    expect(onTaskComplete).not.toHaveBeenCalled()
    await acknowledgeCodes()
    await screen.findByText('Recovery codes saved')
    expect(onTaskComplete).toHaveBeenCalledWith('recovery_codes')
    fireEvent.click(screen.getByRole('link', { name: 'Continue' }))
    expect(onExit).toHaveBeenLastCalledWith({
      gap: 'missing',
      areCodesSaved: true,
      isFactorComplete: false,
    })
  })

  test('retains the authenticator dialog when background factors change', async () => {
    const { rerender } = customRender(
      <RecoveryReminder gap="missing" destination="/organizations" hasAuthenticatorTask />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add authenticator' }))
    await enrollFactor()
    rerender(
      <RecoveryReminder gap="missing" destination="/organizations" hasAuthenticatorTask={false} />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await verifyFactor()
  })

  test('supports a codes-only task list', () => {
    customRender(
      <RecoveryReminder gap="missing" destination="/organizations" hasAuthenticatorTask={false} />
    )
    expect(screen.getByText('No recovery codes')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add authenticator' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip for now' })).toHaveAttribute(
      'href',
      '/organizations'
    )
  })

  test('keeps newly generated codes visible through a live status update until acknowledged', async () => {
    vi.spyOn(auth.mfa.recoveryCodes, 'generate').mockResolvedValue(response)
    const { rerender } = customRender(
      <RecoveryReminder gap="missing" destination="/org/example" hasAuthenticatorTask={false} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Generate codes' }))
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')

    // A refetch sees new codes before the user has saved them.
    rerender(
      <RecoveryReminder gap={null} destination="/org/example" hasAuthenticatorTask={false} />
    )
    expect(screen.getByText('WTO2-4T5X-BEUL-VJMI')).toBeInTheDocument()
    expect(screen.queryByText('Recovery codes saved')).not.toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await acknowledgeCodes()
    await screen.findByText('Recovery codes saved')
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/org/example')
  })

  test('keeps the pending dialog open and prevents premature completion', async () => {
    let resolveGeneration: (value: typeof response) => void = () => {}
    const generation = new Promise<typeof response>((resolve) => {
      resolveGeneration = resolve
    })
    vi.spyOn(auth.mfa.recoveryCodes, 'generate').mockReturnValue(generation)
    customRender(
      <RecoveryReminder gap="missing" destination="/organizations" hasAuthenticatorTask={false} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Generate codes' }))
    await screen.findByText('Generating your recovery codes...')
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument()
    resolveGeneration(response)
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')
    await acknowledgeCodes()
    await screen.findByText('Recovery codes saved')
  })

  test('returns to the reminder on error and allows retry', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Project not selected' }, { status: 404 }),
    })
    vi.spyOn(auth.mfa.recoveryCodes, 'generate')
      .mockResolvedValueOnce({ data: null, error: new AuthError('generation failed') })
      .mockResolvedValue(response)
    customRender(
      <RecoveryReminder gap="missing" destination="/organizations" hasAuthenticatorTask={false} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Generate codes' }))
    await screen.findByText('Unable to generate recovery codes')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Recovery codes saved')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Generate codes' }))
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')
    await acknowledgeCodes()
    await screen.findByText('Recovery codes saved')
  })

  test('requires regeneration confirmation and preserves the reminder when cancelled', async () => {
    const regenerate = vi.spyOn(auth.mfa.recoveryCodes, 'regenerate').mockResolvedValue(response)
    customRender(
      <RecoveryReminder gap="exhausted" destination="/organizations" hasAuthenticatorTask={false} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate codes' }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Close' })
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(regenerate).not.toHaveBeenCalled()
    expect(screen.queryByText('Recovery codes saved')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate codes' }))
    await confirmRegeneration()
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')
    await acknowledgeCodes()
    await screen.findByText('Recovery codes saved')
  })

  test('does not claim the account is safe when recovery checks fail', () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Project not selected' }, { status: 404 }),
    })
    customRender(<RecoveryReminder gap={null} destination="/organizations" isError />)
    expect(screen.queryByText('You’re all set')).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Account recovery check unavailable' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/organizations')
  })
})
