import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TOTPFactors } from './index'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

const mock = vi.hoisted(() => ({ listFactors: vi.fn(), getStatus: vi.fn() }))
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag: () => true,
  useUser: () => ({ id: 'user-a' }),
}))
vi.mock('@/lib/gotrue', () => ({
  auth: { mfa: { listFactors: mock.listFactors, recoveryCodes: { getStatus: mock.getStatus } } },
}))
vi.mock('./AddNewFactorModal', () => ({
  AddNewFactorModal: ({ visible, onClose }: { visible: boolean; onClose: () => void }) =>
    visible ? (
      <div role="dialog" aria-label="Add authenticator">
        <button tabIndex={0} onClick={onClose}>
          Cancel setup
        </button>
      </div>
    ) : null,
}))
vi.mock('./DeleteFactorModal', () => ({ DeleteFactorModal: () => null }))

const factor = {
  id: 'factor-a',
  friendly_name: 'Phone',
  factor_type: 'totp',
  status: 'verified',
  created_at: '2026-10-01T00:00:00Z',
}
const renderSection = (finding?: AccountRecoveryFinding, searchParams = '') =>
  customRender(
    <TOTPFactors
      findings={finding ? [finding] : []}
      primaryAction={finding?.action ?? 'enable-mfa'}
    />,
    { nuqs: { searchParams } }
  )

describe('account security MFA and recovery sections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mock.listFactors.mockResolvedValue({ data: { totp: [factor], all: [factor] }, error: null })
    mock.getStatus.mockResolvedValue({ data: { remaining: 10, total: 10 }, error: null })
  })

  it('shows MFA off when only unverified authenticators exist', async () => {
    const unverified = { ...factor, status: 'unverified' }
    mock.listFactors.mockResolvedValue({
      data: { totp: [unverified], all: [unverified] },
      error: null,
    })
    renderSection()
    expect(await screen.findByText('Set up multi-factor authentication')).toBeInTheDocument()
    const setupButtons = [
      screen.getByRole('button', { name: 'Set up MFA' }),
      screen.getByRole('button', { name: 'Set up MFA first' }),
    ]
    expect(setupButtons).toHaveLength(2)
    expect(screen.getByText('Set up recovery codes')).toBeInTheDocument()
    await userEvent.click(setupButtons[1])
    expect(await screen.findByRole('dialog', { name: 'Add authenticator' })).toBeInTheDocument()
    expect(mock.getStatus).not.toHaveBeenCalled()
  })

  it('shows missing codes with a generation action', async () => {
    mock.getStatus.mockResolvedValue({ data: null, error: { code: 'mfa_factor_not_found' } })
    renderSection({ id: 'recovery-codes-missing', severity: 'warning', action: 'generate-codes' })
    expect(await screen.findByText('No recovery codes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate recovery codes' })).toBeInTheDocument()
    expect(screen.queryByText('Avoid being locked out')).not.toBeInTheDocument()
  })

  it.each([1, 3])('shows a low code count of %s with a regeneration action', async (remaining) => {
    mock.getStatus.mockResolvedValue({ data: { remaining, total: 10 }, error: null })
    renderSection({
      id: 'recovery-codes-low',
      severity: 'warning',
      action: 'regenerate-codes',
      remainingCodes: remaining,
    })
    expect(
      await screen.findByText(`${remaining} of 10 recovery codes available`)
    ).toBeInTheDocument()
    expect(
      screen.getByText('Generate a new set before you need them to recover your account.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument()
  })

  it('shows exhausted codes and keeps removal in the options menu', async () => {
    mock.getStatus.mockResolvedValue({ data: { remaining: 0, total: 10 }, error: null })
    renderSection({
      id: 'recovery-codes-exhausted',
      severity: 'critical',
      action: 'regenerate-codes',
      remainingCodes: 0,
    })
    expect(await screen.findByText('Recovery codes used up')).toBeInTheDocument()
    expect(screen.queryByText('Remove')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Recovery code options' }))
    expect(await screen.findByRole('menuitem', { name: 'Remove codes' })).toBeInTheDocument()
  })

  it('shows available codes without inventing a backup recommendation', async () => {
    renderSection()
    expect(await screen.findByText('10 of 10 recovery codes available')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.queryByText('1 verified authenticator')).not.toBeInTheDocument()
    expect(screen.queryByText('Add a backup authenticator')).not.toBeInTheDocument()
  })

  it('shows a backup warning with one authenticator action', async () => {
    renderSection({ id: 'single-mfa-factor', severity: 'warning', action: 'add-factor' })
    expect(await screen.findByText('Add a backup authenticator')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Add authenticator' })).toHaveLength(1)
    expect(
      await screen.findByRole('button', { name: 'Remove Phone authenticator' })
    ).toBeInTheDocument()
  })

  it('does not infer missing codes when the status check fails', async () => {
    mock.getStatus.mockResolvedValue({ data: null, error: new Error('Status unavailable') })
    renderSection()
    expect(await screen.findByText('Failed to load recovery codes')).toBeInTheDocument()
    expect(screen.queryByText('No recovery codes')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Generate recovery codes' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Phone authenticator' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it.each([1, 2] as const)(
    'renders local preview count %s with interactive sample regeneration and no account reads',
    async (remaining) => {
      customRender(
        <TOTPFactors
          previewRemaining={remaining}
          findings={[{ id: 'recovery-codes-low', severity: 'warning', action: 'regenerate-codes' }]}
          primaryAction="regenerate-codes"
        />
      )
      expect(screen.getByText(`${remaining} of 10 recovery codes available`)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Regenerate' })).toBeEnabled()
      await userEvent.click(screen.getByRole('button', { name: 'Regenerate' }))
      expect(await screen.findByText('Regenerate my recovery codes')).toBeInTheDocument()
      await userEvent.type(screen.getByPlaceholderText('REGENERATE'), 'REGENERATE')
      const confirm = within(screen.getByRole('dialog')).getByRole('button', { name: 'Regenerate' })
      await waitFor(() => expect(confirm).toBeEnabled())
      const form = confirm.closest('form')
      if (!form) throw new Error('Missing confirmation form')
      fireEvent.submit(form)
      expect(await screen.findByText('Save your recovery codes')).toBeInTheDocument()
      expect(mock.listFactors).not.toHaveBeenCalled()
      expect(mock.getStatus).not.toHaveBeenCalled()
    }
  )

  it('opens the authenticator action destination and consumes it when closed', async () => {
    renderSection(undefined, '?securityAction=add-factor')
    expect(await screen.findByRole('dialog', { name: 'Add authenticator' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel setup' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Add authenticator' })).not.toBeInTheDocument()
    )
  })
})
