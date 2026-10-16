import { AuthError } from '@supabase/auth-js'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { formatRecoveryCode } from './RecoveryCodesModal.utils'
import { RegenerateRecoveryCodesModal } from './RegenerateRecoveryCodesModal'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

const { mockCopyToClipboard } = vi.hoisted(() => ({
  mockCopyToClipboard: vi.fn((_value: string, callback: () => void) => {
    return callback()
  }),
}))
vi.mock('ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ui')>()),
  copyToClipboard: mockCopyToClipboard,
}))

const codes = [
  'wto24t5xbeulvjmi',
  'ade6in2sufndbbwd',
  'oge3npsrhrr66k25',
  'pxbkfvxlbi6ggvnf',
  'kc3oaioqdjn4htc3',
  '363gseoknplambiy',
  '3urgae2p2jegem4m',
  'tbxog2guayp6uvud',
  'rpcvcf4owbclxrfp',
  'kyyfsp3eqjydj53t',
]

describe('RegenerateRecoveryCodesModal', () => {
  test('regenerate the recovery codes after confirmation and allow users to copy them', async () => {
    vi.spyOn(auth.mfa.recoveryCodes, 'regenerate').mockResolvedValue({
      data: {
        id: 'some_id',
        total: 10,
        codes,
        type: 'recovery_code',
      },
      error: null,
    })
    customRender(<RegenerateRecoveryCodesModal />)
    fireEvent.click(await screen.findByRole('button', { name: 'Regenerate' }))

    // Confirm regeneration
    await userEvent.type(
      await within(await screen.findByRole('dialog')).findByRole('textbox', {
        name: /Type REGENERATE to confirm./,
      }),
      'REGENERATE'
    )
    fireEvent.click(
      await within(await screen.findByRole('dialog')).findByRole('button', { name: 'Regenerate' })
    )

    // Codes are generated
    await screen.findByText('Save your recovery codes')
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')
    await screen.findByText('KYYF-SP3E-QJYD-J53T')

    // Users have to copy the codes before they can close the modal
    expect(await screen.findByRole('button', { name: 'Done' })).toBeDisabled()
    fireEvent.click(await screen.findByRole('button', { name: 'Copy' }))
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'I have saved my recovery codes somewhere safe' })
    )

    expect(mockCopyToClipboard).toHaveBeenCalledWith(
      codes.map((code) => formatRecoveryCode(code)).join('\n'),
      expect.any(Function)
    )

    // Done button is now enabled and closes the modal
    const doneButton = await screen.findByRole('button', { name: 'Done' })
    expect(doneButton).toBeEnabled()
    fireEvent.click(doneButton)
    await waitFor(() => expect(screen.queryByText('Save your recovery codes')).toBeNull())
  })

  test('allow users to retry in case of error', async () => {
    vi.spyOn(auth.mfa.recoveryCodes, 'regenerate')
      .mockRejectedValueOnce({
        data: null,
        error: new AuthError('boom'),
      })
      .mockResolvedValue({
        data: {
          id: 'some_id',
          total: 10,
          codes,
          type: 'recovery_code',
        },
        error: null,
      })
    customRender(<RegenerateRecoveryCodesModal />)
    fireEvent.click(await screen.findByRole('button', { name: 'Regenerate' }))

    // Confirm regeneration
    await userEvent.type(
      await within(await screen.findByRole('dialog')).findByRole('textbox', {
        name: /Type REGENERATE to confirm./,
      }),
      'REGENERATE'
    )
    fireEvent.click(
      await within(await screen.findByRole('dialog')).findByRole('button', { name: 'Regenerate' })
    )
    await screen.findByText('Unable to generate recovery codes')
    expect(await screen.findByText(/Try refreshing your browser/)).toHaveTextContent(
      'Try refreshing your browser, but if the issue persists for more than a few minutes, contact support.'
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByText('Save your recovery codes')).toBeNull())

    // Retry
    fireEvent.click(await screen.findByRole('button', { name: 'Regenerate' }))
    // Confirm regeneration
    await userEvent.type(
      await within(await screen.findByRole('dialog')).findByRole('textbox', {
        name: /Type REGENERATE to confirm./,
      }),
      'REGENERATE'
    )
    fireEvent.click(
      await within(await screen.findByRole('dialog')).findByRole('button', { name: 'Regenerate' })
    )
    // Codes are generated
    await screen.findByText('Save your recovery codes')
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')
    await screen.findByText('KYYF-SP3E-QJYD-J53T')
  })
})
