import { AuthError } from '@supabase/auth-js'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

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

const codes = Array.from(Array(10).keys()).map((i) => `code_${i}`)

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
    fireEvent.click(await screen.findByRole('button', { name: 'Regenerate my recovery codes' }))

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
    await screen.findByText('code_0')
    await screen.findByText('code_9')

    // Users have to copy the codes to close the modal, next click should fail if they managed to close it
    expect(await screen.findAllByRole('button', { name: 'Close' })).toHaveLength(1)
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Copy to clipboard' }))
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'I have copied the codes' })).toBeChecked()
    )
    expect(mockCopyToClipboard).toHaveBeenCalledWith(codes.join('\n'), expect.any(Function))

    // We should have 2 close buttons (header icon and a standard button)
    expect(await screen.findAllByRole('button', { name: 'Close' })).toHaveLength(2)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Close' })).at(1)!)
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
    fireEvent.click(await screen.findByRole('button', { name: 'Regenerate my recovery codes' }))

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
    await screen.findByText(
      "We couldn't generate your recovery code. Please try again later or contact support if the problem persists."
    )

    // We should have 2 close buttons (header icon and a standard button)
    expect(await screen.findAllByRole('button', { name: 'Close' })).toHaveLength(2)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Close' })).at(1)!)
    await waitFor(() => expect(screen.queryByText('Save your recovery codes')).toBeNull())

    // Retry
    fireEvent.click(await screen.findByRole('button', { name: 'Regenerate my recovery codes' }))
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
    await screen.findByText('code_0')
    await screen.findByText('code_9')
  })
})
