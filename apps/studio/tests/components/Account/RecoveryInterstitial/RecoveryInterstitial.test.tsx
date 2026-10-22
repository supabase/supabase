import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { RecoveryReminder } from '@/components/interfaces/Account/RecoveryInterstitial/RecoveryInterstitial'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

describe('RecoveryReminder', () => {
  test.each(['missing', 'exhausted'] as const)(
    'previews %s without changing the account',
    async (gap) => {
      const generate = vi.spyOn(auth.mfa.recoveryCodes, 'generate')
      const regenerate = vi.spyOn(auth.mfa.recoveryCodes, 'regenerate')
      const { rerender } = customRender(
        <RecoveryReminder gap={gap} destination="/organizations?view=all" isPreview />
      )
      fireEvent.click(
        screen.getByRole('button', {
          name: gap === 'missing' ? 'Generate codes' : 'Regenerate codes',
        })
      )
      if (gap === 'exhausted') {
        const dialog = await screen.findByRole('dialog')
        await userEvent.type(
          within(dialog).getByRole('textbox', { name: /Type REGENERATE to confirm/ }),
          'REGENERATE'
        )
        fireEvent.click(within(dialog).getByRole('button', { name: 'Regenerate' }))
      }
      await screen.findByText('PREVIEW-NOT-A-VALID-RECOVERY-CODE-01')
      rerender(<RecoveryReminder gap={null} destination="/organizations?view=all" isPreview />)
      expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'I have saved my recovery codes somewhere safe' })
      )
      fireEvent.click(screen.getByRole('button', { name: 'Done' }))
      await screen.findByText('Recovery codes saved')
      expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute(
        'href',
        '/organizations?view=all'
      )
      expect(generate).not.toHaveBeenCalled()
      expect(regenerate).not.toHaveBeenCalled()
    }
  )
})
