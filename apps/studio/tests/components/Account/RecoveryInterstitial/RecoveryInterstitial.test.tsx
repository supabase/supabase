import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { RecoveryReminder } from '@/components/interfaces/Account/RecoveryInterstitial/RecoveryInterstitial'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

describe('RecoveryReminder', () => {
  test('does not claim success when the recovery check fails', () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Project not selected' }, { status: 404 }),
    })
    customRender(<RecoveryReminder gap={null} destination="/organizations" isError />)
    expect(
      screen.getByRole('heading', { name: 'Account recovery check unavailable' })
    ).toBeInTheDocument()
    expect(screen.queryByText('You’re all set')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue' })).toBeInTheDocument()
  })

  test.each(['missing', 'exhausted'] as const)(
    'previews %s with mocked SDK responses',
    async (gap) => {
      const result = {
        data: {
          id: 'codes',
          type: 'recovery_code' as const,
          total: 1,
          codes: ['wto24t5xbeulvjmi'],
        },
        error: null,
      }
      const generate = vi.spyOn(auth.mfa.recoveryCodes, 'generate').mockResolvedValue(result)
      const regenerate = vi.spyOn(auth.mfa.recoveryCodes, 'regenerate').mockResolvedValue(result)
      const { rerender } = customRender(
        <RecoveryReminder gap={gap} destination="/organizations?view=all" />
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
      await screen.findByText('WTO2-4T5X-BEUL-VJMI')
      rerender(<RecoveryReminder gap={null} destination="/organizations?view=all" />)
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
      expect(generate).toHaveBeenCalledTimes(gap === 'missing' ? 1 : 0)
      expect(regenerate).toHaveBeenCalledTimes(gap === 'exhausted' ? 1 : 0)
    }
  )
})
