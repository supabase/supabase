import { AuthApiError } from '@supabase/auth-js'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFlag } from 'common'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { AddNewFactorModal } from '@/components/interfaces/Account/TOTPFactors/AddNewFactorModal'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

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
      totp: { qr_code: 'data:image/svg+xml,<svg/>', secret: 'preview', uri: 'otpauth://preview' },
    },
    error: null,
  })
  await userEvent.type(screen.getByRole('textbox', { name: 'Authenticator app name' }), 'Backup')
  fireEvent.click(screen.getByRole('button', { name: 'Generate QR' }))
  await screen.findByText('Verify new factor Backup')
}

describe('AddNewFactorModal completion', () => {
  beforeEach(() => vi.mocked(useFlag).mockReturnValue(false))
  test('canceling an unverified factor does not complete the task', async () => {
    vi.spyOn(auth.mfa, 'unenroll').mockResolvedValue({ data: { id: 'backup-factor' }, error: null })
    const onComplete = vi.fn()
    const onClose = vi.fn()
    customRender(<AddNewFactorModal visible onClose={onClose} onComplete={onComplete} />)
    await enrollFactor()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(onComplete).not.toHaveBeenCalled()
  })

  test('completes only after successful authenticator verification', async () => {
    vi.spyOn(auth.mfa, 'challengeAndVerify').mockResolvedValue({
      data: {
        access_token: 'preview',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'preview',
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
    const onComplete = vi.fn()
    const onClose = vi.fn()
    customRender(<AddNewFactorModal visible onClose={onClose} onComplete={onComplete} />)
    await enrollFactor()
    expect(onComplete).not.toHaveBeenCalled()
    await userEvent.type(screen.getByRole('textbox', { name: 'Authentication code' }), '123456')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce())
    expect(onClose).toHaveBeenCalledOnce()
  })

  test('factor-first flow completes codes only after their save acknowledgement', async () => {
    vi.mocked(useFlag).mockReturnValue(true)
    vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockResolvedValue({
      data: null,
      error: new AuthApiError('No recovery codes', 404, 'mfa_factor_not_found'),
    })
    vi.spyOn(auth.mfa.recoveryCodes, 'generate').mockResolvedValue({
      data: { id: 'codes', type: 'recovery_code', total: 1, codes: ['wto24t5xbeulvjmi'] },
      error: null,
    })
    vi.spyOn(auth.mfa, 'challengeAndVerify').mockResolvedValue({
      data: {
        access_token: 'preview',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'preview',
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
    const onComplete = vi.fn()
    const onRecoveryCodesSaved = vi.fn()
    customRender(
      <AddNewFactorModal
        visible
        onClose={() => {}}
        onComplete={onComplete}
        onRecoveryCodesSaved={onRecoveryCodesSaved}
      />
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Generate QR' })).not.toBeDisabled()
    )
    await enrollFactor()
    await userEvent.type(screen.getByRole('textbox', { name: 'Authentication code' }), '123456')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')
    expect(onComplete).toHaveBeenCalledOnce()
    expect(onRecoveryCodesSaved).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'I have saved my recovery codes somewhere safe' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(onRecoveryCodesSaved).toHaveBeenCalledOnce())
  })
})
