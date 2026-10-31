import { AuthApiError, AuthError } from '@supabase/auth-js'
import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { useFlag } from 'common'
import { useState } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { AddNewFactorModal } from '@/components/interfaces/Account/TOTPFactors/AddNewFactorModal'
import { recoveryCodeKeys } from '@/data/recovery-codes/keys'
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
  fireEvent.change(screen.getByRole('textbox', { name: 'Authenticator app name' }), {
    target: { value: 'Backup' },
  })
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
    fireEvent.change(screen.getByRole('textbox', { name: 'Authentication code' }), {
      target: { value: '123456' },
    })
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
    fireEvent.change(screen.getByRole('textbox', { name: 'Authentication code' }), {
      target: { value: '123456' },
    })
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
  test('cannot cancel a verified factor while cached code status refreshes', async () => {
    vi.mocked(useFlag).mockReturnValue(true)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(recoveryCodeKeys.status(), { status: 'available', data: { remaining: 4 } })
    let finishStatus = () => {}
    vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockImplementation(
      () =>
        new Promise((resolve) => {
          finishStatus = () =>
            resolve({
              data: { id: 'codes', type: 'recovery_code', total: 4, remaining: 4 },
              error: null,
            })
        })
    )
    const unenroll = vi.spyOn(auth.mfa, 'unenroll')
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
    customRender(<AddNewFactorModal visible onClose={onClose} onComplete={onComplete} />, {
      queryClient: client,
    })
    await enrollFactor()
    fireEvent.change(screen.getByRole('textbox', { name: 'Authentication code' }), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(unenroll).not.toHaveBeenCalled()
    await act(async () => finishStatus())
  })
})

describe('Security backup authenticator offer', () => {
  const onComplete = vi.fn()
  const onSaved = vi.fn()
  function Enrollment() {
    const [visible, setVisible] = useState(true)
    return (
      <AddNewFactorModal
        visible={visible}
        onClose={() => setVisible(false)}
        onComplete={onComplete}
        onRecoveryCodesSaved={onSaved}
      />
    )
  }
  const factor = {
    id: 'totp-1',
    friendly_name: 'Main',
    factor_type: 'totp' as const,
    status: 'verified' as const,
    created_at: '',
    updated_at: '',
  }
  beforeEach(() => {
    vi.mocked(useFlag).mockReturnValue(true)
    vi.clearAllMocks()
    vi.spyOn(auth.mfa, 'enroll').mockResolvedValue({
      data: {
        id: 'totp-1',
        type: 'totp',
        friendly_name: 'Main',
        totp: { qr_code: 'data:image/svg+xml,', secret: 'secret', uri: 'uri' },
      },
      error: null,
    })
    vi.spyOn(auth.mfa, 'challengeAndVerify').mockResolvedValue({
      data: {
        access_token: 'token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'refresh',
        user: {
          id: 'user',
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: '',
        },
      },
      error: null,
    })
    vi.spyOn(auth.mfa, 'unenroll').mockResolvedValue({ data: { id: 'totp-1' }, error: null })
    vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockResolvedValue({
      data: null,
      error: new AuthError('Missing', 404, 'mfa_factor_not_found'),
    })
    vi.spyOn(auth.mfa.recoveryCodes, 'generate').mockResolvedValue({
      data: { id: 'codes', type: 'recovery_code', total: 1, codes: ['abcdefghijklmnop'] },
      error: null,
    })
    vi.spyOn(auth.mfa, 'listFactors').mockResolvedValue({
      data: { all: [factor], totp: [factor], phone: [], recovery_code: [], webauthn: [] },
      error: null,
    })
  })
  async function enroll() {
    fireEvent.change(await screen.findByRole('textbox', { name: 'Authenticator app name' }), {
      target: { value: 'Main' },
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate QR' }))
    await screen.findByRole('textbox', { name: 'Authentication code' })
  }
  async function verifyAndSave() {
    await enroll()
    fireEvent.change(screen.getByRole('textbox', { name: 'Authentication code' }), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await screen.findByText('Save your recovery codes')
    expect(screen.queryByText('Add a backup authenticator?')).toBeNull()
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'I have saved my recovery codes somewhere safe' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
  }
  test('offers optional backup after saving and restarts setup without generating twice', async () => {
    customRender(<Enrollment />)
    await verifyAndSave()
    await screen.findByText('Add a backup authenticator?')
    expect(onSaved).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Add another' }))
    expect(await screen.findByRole('textbox', { name: 'Authenticator app name' })).toHaveValue('')
    expect(auth.mfa.recoveryCodes.generate).toHaveBeenCalledOnce()
    expect(onComplete).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Authenticator app name' })).toBeNull()
    )
    expect(onSaved).toHaveBeenCalledOnce()
  })
  test('Not now finishes without starting another enrollment', async () => {
    customRender(<Enrollment />)
    await verifyAndSave()
    fireEvent.click(await screen.findByRole('button', { name: 'Not now' }))
    await waitFor(() => expect(screen.queryByText('Add a backup authenticator?')).toBeNull())
    expect(onComplete).toHaveBeenCalledOnce()
    expect(onSaved).toHaveBeenCalledOnce()
    expect(auth.mfa.enroll).toHaveBeenCalledOnce()
  })
  test('does not offer another backup with two verified authenticators', async () => {
    vi.spyOn(auth.mfa, 'listFactors').mockResolvedValue({
      data: {
        all: [factor, { ...factor, id: 'totp-2' }],
        totp: [factor],
        phone: [],
        recovery_code: [],
        webauthn: [],
      },
      error: null,
    })
    customRender(<Enrollment />)
    await verifyAndSave()
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
    expect(screen.queryByText('Add a backup authenticator?')).toBeNull()
  })
  test('cancellation does not generate codes or complete enrollment', async () => {
    customRender(<Enrollment />)
    await enroll()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(auth.mfa.unenroll).toHaveBeenCalledOnce())
    expect(onComplete).not.toHaveBeenCalled()
    expect(auth.mfa.recoveryCodes.generate).not.toHaveBeenCalled()
  })
})
