import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RoleImpersonationSelectorInterface } from '@/components/interfaces/RoleImpersonationSelector'
import type { ImpersonationRole } from '@/lib/role-impersonation'
import type { RoleImpersonationController } from '@/state/role-impersonation-state'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

vi.mock('@/components/interfaces/RoleImpersonationSelector/UserImpersonationSelector', () => ({
  UserImpersonationSelector: ({ disabled }: { disabled?: boolean }) => (
    <fieldset data-testid="user-settings" disabled={disabled}>
      <button type="button" tabIndex={0}>
        Project
      </button>
    </fieldset>
  ),
}))

describe('RoleImpersonationSelectorInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enables user settings for authenticated queries and summarizes each role', async () => {
    const user = userEvent.setup()
    let currentRole: ImpersonationRole | undefined
    const setRole = vi.fn(async (role: ImpersonationRole | undefined) => {
      currentRole = role
    })
    const state: RoleImpersonationController = {
      get role() {
        return currentRole
      },
      claims: undefined,
      setRole,
    }

    const { rerender } = customRender(<RoleImpersonationSelectorInterface state={state} />)

    expect(screen.queryByText('Role')).not.toBeInTheDocument()
    for (const option of screen.getAllByRole('radio')) {
      expect(option).toHaveClass('w-full')
      expect(option.querySelector('svg')).toBeInTheDocument()
    }
    expect(screen.getByRole('radio', { name: 'PostgresSuperuser' })).toBeChecked()
    expect(screen.getByText('Bypasses RLS and can return all rows.')).toBeVisible()
    expect(screen.getByTestId('user-settings')).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'AuthenticatedLogged-in user' }))

    expect(screen.getByText('Returns rows available to the selected user.')).toBeVisible()
    expect(screen.getByTestId('user-settings')).not.toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'AnonymousNot logged in' }))
    rerender(<RoleImpersonationSelectorInterface state={state} />)

    expect(screen.getByText('Returns rows available to anonymous users.')).toBeVisible()
    expect(setRole).toHaveBeenCalledWith({ type: 'postgrest', role: 'anon' })
    expect(screen.getByTestId('user-settings')).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'PostgresSuperuser' }))
    rerender(<RoleImpersonationSelectorInterface state={state} />)

    expect(screen.getByText('Bypasses RLS and can return all rows.')).toBeVisible()
    expect(setRole).toHaveBeenCalledWith(undefined)
  })

  it('follows externally cleared role state', () => {
    let currentRole: ImpersonationRole | undefined = {
      type: 'postgrest',
      role: 'authenticated',
      userType: 'native',
    }
    const state: RoleImpersonationController = {
      get role() {
        return currentRole
      },
      claims: undefined,
      setRole: vi.fn(),
    }

    const { rerender } = customRender(<RoleImpersonationSelectorInterface state={state} />)

    expect(screen.getByRole('radio', { name: 'AuthenticatedLogged-in user' })).toBeChecked()
    expect(screen.getByTestId('user-settings')).not.toBeDisabled()

    currentRole = undefined
    rerender(<RoleImpersonationSelectorInterface state={state} />)

    expect(screen.getByRole('radio', { name: 'PostgresSuperuser' })).toBeChecked()
    expect(screen.getByTestId('user-settings')).toBeDisabled()
  })

  it('allows switching roles while impersonating a user', async () => {
    const user = userEvent.setup()
    const setRole = vi.fn().mockResolvedValue(undefined)
    const state: RoleImpersonationController = {
      role: {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'external',
        externalAuth: { sub: 'external-user', additionalClaims: {} },
      },
      claims: undefined,
      setRole,
    }

    customRender(<RoleImpersonationSelectorInterface state={state} />)

    await user.click(screen.getByRole('radio', { name: 'AnonymousNot logged in' }))

    expect(setRole).toHaveBeenCalledWith({ type: 'postgrest', role: 'anon' })
  })

  it('keeps the current selection and reports rejected role switches', async () => {
    const user = userEvent.setup()
    const state: RoleImpersonationController = {
      role: undefined,
      claims: undefined,
      setRole: vi.fn().mockRejectedValue({ message: 'Role switch failed' }),
    }

    customRender(<RoleImpersonationSelectorInterface state={state} />)
    await user.click(screen.getByRole('radio', { name: 'AnonymousNot logged in' }))

    expect(screen.getByRole('radio', { name: 'PostgresSuperuser' })).toBeChecked()
    expect(toast.error).toHaveBeenCalledWith('Failed to impersonate user: Role switch failed')
  })
})
