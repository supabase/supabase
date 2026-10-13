import { AuthError } from '@supabase/auth-js'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'

import { AddNewFactorModal } from './AddNewFactorModal'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag: () => true,
}))
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
  fireEvent.click(screen.getByRole('button', { name: 'Add authenticator' }))
  expect(await screen.findByRole('textbox', { name: 'Authenticator app name' })).toHaveValue('')
  expect(auth.mfa.recoveryCodes.generate).toHaveBeenCalledOnce()
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
