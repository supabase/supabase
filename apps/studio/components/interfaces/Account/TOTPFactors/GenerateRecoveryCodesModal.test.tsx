import { AuthError } from '@supabase/auth-js'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, onTestFinished, test, vi } from 'vitest'

import { GenerateRecoveryCodesModal } from './GenerateRecoveryCodesModal'
import { RecoveryCodesModal } from './RecoveryCodesModal'
import { formatRecoveryCode } from './RecoveryCodesModal.utils'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

const { mockCopyToClipboard, mockTrack } = vi.hoisted(() => ({
  mockCopyToClipboard: vi.fn((_value: string, callback: () => void) => {
    return callback()
  }),
  mockTrack: vi.fn(),
}))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))
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

describe('GenerateRecoveryCodesModal', () => {
  test('shows shimmer content while codes are being generated', () => {
    customRender(
      <RecoveryCodesModal
        open
        onOpenChange={vi.fn()}
        mutation={{
          data: undefined,
          status: 'pending',
          error: null,
          isError: false,
          isPending: true,
          isSuccess: false,
          reset: vi.fn(),
        }}
      />
    )
    expect(screen.getByRole('status', { name: 'Generating recovery codes' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  test('lets users copy and download generated recovery codes and tracks both actions', async () => {
    const downloadClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL = vi.fn(() => 'blob:recovery-codes')
        static revokeObjectURL = vi.fn()
      }
    )
    onTestFinished(() => {
      downloadClick.mockRestore()
      vi.unstubAllGlobals()
    })

    vi.spyOn(auth.mfa.recoveryCodes, 'generate').mockResolvedValue({
      data: {
        id: 'some_id',
        total: 10,
        codes,
        type: 'recovery_code',
      },
      error: null,
    })
    customRender(<GenerateRecoveryCodesModal />)
    fireEvent.click(await screen.findByRole('button', { name: 'Generate recovery codes' }))

    // Codes are generated
    await screen.findByText('Save your recovery codes')
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')
    await screen.findByText('KYYF-SP3E-QJYD-J53T')

    expect(await screen.findByRole('button', { name: 'Done' })).toBeDisabled()
    const copyButton = screen.getByRole('button', { name: 'Copy' })
    mockCopyToClipboard.mockImplementationOnce(() => {})
    fireEvent.click(copyButton)
    expect(mockTrack).not.toHaveBeenCalled()

    fireEvent.click(copyButton)
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'I have saved my recovery codes somewhere safe' })
    )
    expect(mockCopyToClipboard).toHaveBeenCalledWith(
      codes.map((code) => formatRecoveryCode(code)).join('\n'),
      expect.any(Function)
    )
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(downloadClick).toHaveBeenCalledOnce()
    expect(mockTrack.mock.calls).toEqual([
      ['recovery_codes_copied'],
      ['recovery_codes_download_clicked'],
    ])

    // Done button is now enabled and closes the modal
    const doneButton = await screen.findByRole('button', { name: 'Done' })
    expect(doneButton).toBeEnabled()
    fireEvent.click(doneButton)
    await waitFor(() => expect(screen.queryByText('Save your recovery codes')).toBeNull())
  })

  test('allow users to retry in case of error', async () => {
    vi.spyOn(auth.mfa.recoveryCodes, 'generate')
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
    customRender(<GenerateRecoveryCodesModal />)
    fireEvent.click(await screen.findByRole('button', { name: 'Generate recovery codes' }))
    await screen.findByText('Unable to generate recovery codes')
    expect(await screen.findByText(/Try refreshing your browser/)).toHaveTextContent(
      'Try refreshing your browser, but if the issue persists for more than a few minutes, contact support.'
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByText('Save your recovery codes')).toBeNull())

    // Retry
    fireEvent.click(await screen.findByRole('button', { name: 'Generate recovery codes' }))
    // Codes are generated
    await screen.findByText('Save your recovery codes')
    await screen.findByText('WTO2-4T5X-BEUL-VJMI')
    await screen.findByText('KYYF-SP3E-QJYD-J53T')
  })
})
