import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { customRender as render } from 'tests/lib/custom-render'

vi.mock('hooks/misc/useSelectedProject', () => ({
  useIsProjectActive: () => true,
  useSelectedProjectQuery: () => ({ data: { id: 1 } }),
}))

vi.mock('hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))

import ResetDbPassword from 'components/interfaces/Settings/Database/DatabaseSettings/ResetDbPassword'

describe('ResetDbPassword', () => {
  it('renders the reset password button', () => {
    render(<ResetDbPassword />)
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
  })

  it('mentions transaction and session pooler in the warning text', () => {
    render(<ResetDbPassword />)
    // Regression for #44210: users must be informed that pooler connections
    // (both transaction pooler port 6543 and session pooler port 5432) are
    // affected by a password reset and may take a moment to reflect the change.
    expect(screen.getByText(/transaction and session pooler/i)).toBeInTheDocument()
    expect(screen.getByText(/ports 5432 and 6543/i)).toBeInTheDocument()
  })

  it('mentions propagation delay in the warning text', () => {
    render(<ResetDbPassword />)
    expect(screen.getByText(/take a short moment/i)).toBeInTheDocument()
  })

  it('opens the reset modal when the button is clicked', async () => {
    const user = userEvent.setup()
    render(<ResetDbPassword />)

    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('databaseKeys — pooler query keys used in password reset', () => {
  it('poolingConfiguration key includes the project ref', async () => {
    const { databaseKeys } = await import('data/database/keys')
    const key = databaseKeys.poolingConfiguration('my-project')

    expect(key).toContain('my-project')
    expect(key).toContain('pooling-configuration')
  })

  it('pgbouncerConfig key includes the project ref', async () => {
    const { databaseKeys } = await import('data/database/keys')
    const key = databaseKeys.pgbouncerConfig('my-project')

    expect(key).toContain('my-project')
    expect(key).toContain('config')
  })
})
