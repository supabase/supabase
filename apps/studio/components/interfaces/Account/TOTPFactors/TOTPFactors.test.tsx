import { screen } from '@testing-library/react'
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
    await userEvent.click(screen.getByRole('button', { name: 'Set up MFA' }))
    expect(await screen.findByRole('dialog', { name: 'Add authenticator' })).toBeInTheDocument()
    expect(mock.getStatus).not.toHaveBeenCalled()
  })

  it('shows a backup warning with one authenticator action', async () => {
    renderSection({ id: 'single-mfa-factor', severity: 'warning', action: 'add-factor' })
    expect(await screen.findByText('Add a backup authenticator')).toBeInTheDocument()
    expect(await screen.findAllByRole('button', { name: 'Add authenticator' })).toHaveLength(1)
    expect(
      await screen.findByRole('button', { name: 'Remove Phone authenticator' })
    ).toBeInTheDocument()
  })
})
