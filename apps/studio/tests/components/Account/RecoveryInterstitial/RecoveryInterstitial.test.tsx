import { AuthError } from '@supabase/auth-js'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { RecoveryReminder } from '@/components/interfaces/Account/RecoveryInterstitial/RecoveryInterstitial'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

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
  expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'I have saved my recovery codes somewhere safe' })
  )
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
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
  test('completes optional authenticator independently and preserves codes task on cancellation', async () => {
    const enroll = vi.spyOn(auth.mfa, 'enroll')
    const { rerender } = customRender(
      <RecoveryReminder gap="missing" destination="/organizations" isPreview />
    )
    expect(screen.getByRole('link', { name: 'Skip for now' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add authenticator' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Add authenticator' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate codes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add authenticator' }))
    rerender(<RecoveryReminder gap={null} destination="/organizations" isPreview />)
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Complete preview' })
    )
    await screen.findByText('Backup authenticator added')
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate codes' })).toBeInTheDocument()
    expect(screen.queryByText('Recovery codes saved')).not.toBeInTheDocument()
    expect(enroll).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Generate codes' }))
    await screen.findByText('PREVIEW-NOT-A-VALID-RECOVERY-CODE-01')
    await acknowledgeCodes()
    await screen.findByText('Recovery codes saved')
    expect(screen.getAllByRole('button', { name: 'Done' })).toHaveLength(2)
    screen.getAllByRole('button', { name: 'Done' }).forEach((button) => {
      expect(button).toBeDisabled()
    })
  })

  test('reports actions, acknowledged completion, and exit state', async () => {
    const onAction = vi.fn()
    const onTaskComplete = vi.fn()
    const onExit = vi.fn()
    customRender(
      <RecoveryReminder
        gap="missing"
        destination="/organizations"
        isPreview
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
    await screen.findByText('PREVIEW-NOT-A-VALID-RECOVERY-CODE-01')
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
      <RecoveryReminder gap="missing" destination="/organizations" isPreview hasAuthenticatorTask />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add authenticator' }))
    await screen.findByRole('dialog')
    rerender(
      <RecoveryReminder
        gap="missing"
        destination="/organizations"
        isPreview
        hasAuthenticatorTask={false}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Complete preview' })
    )
    await screen.findByText('Backup authenticator added')
  })

  test('supports a codes-only task list', () => {
    customRender(
      <RecoveryReminder
        gap="missing"
        destination="/organizations"
        isPreview
        hasAuthenticatorTask={false}
      />
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

  test.each(['missing', 'exhausted'] as const)(
    'previews %s flow without live mutations',
    async (gap) => {
      const generate = vi.spyOn(auth.mfa.recoveryCodes, 'generate')
      const regenerate = vi.spyOn(auth.mfa.recoveryCodes, 'regenerate')
      customRender(<RecoveryReminder gap={gap} destination="/organizations" isPreview />)
      fireEvent.click(
        screen.getByRole('button', {
          name: gap === 'missing' ? 'Generate codes' : 'Regenerate codes',
        })
      )
      if (gap === 'exhausted') await confirmRegeneration()
      await screen.findByText('PREVIEW-NOT-A-VALID-RECOVERY-CODE-01')
      await acknowledgeCodes()
      await screen.findByText('Recovery codes saved')
      expect(generate).not.toHaveBeenCalled()
      expect(regenerate).not.toHaveBeenCalled()
    }
  )
})
