import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RunAsRoleImpersonationSelector } from '@/components/interfaces/RoleImpersonationSelector/RunAsRoleImpersonationSelector'
import type { RoleImpersonationController } from '@/state/role-impersonation-state'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/components/interfaces/RoleImpersonationSelector/UserImpersonationSelector', () => ({
  UserImpersonationSelector: ({ disabled }: { disabled?: boolean }) => (
    <fieldset data-testid="user-settings" disabled={disabled}>
      <button type="button" tabIndex={0}>
        Project
      </button>
    </fieldset>
  ),
}))

describe('RunAsRoleImpersonationSelector', () => {
  it('enables user settings for authenticated queries and summarizes each role', async () => {
    const user = userEvent.setup()
    const setRole = vi.fn()
    const state: RoleImpersonationController = {
      role: undefined,
      claims: undefined,
      setRole,
    }

    customRender(<RunAsRoleImpersonationSelector state={state} />)

    expect(screen.getByRole('radio', { name: 'PostgresSuperuser' })).toBeChecked()
    expect(screen.getByText('Bypasses RLS and can return all rows.')).toBeVisible()
    expect(screen.getByTestId('user-settings')).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'AuthenticatedLogged-in user' }))

    expect(screen.getByText('Returns rows available to the selected user.')).toBeVisible()
    expect(screen.getByTestId('user-settings')).not.toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'AnonymousNot logged in' }))

    expect(screen.getByText('Returns rows available to anonymous users.')).toBeVisible()
    expect(setRole).toHaveBeenCalledWith({ type: 'postgrest', role: 'anon' })
    expect(screen.getByTestId('user-settings')).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'PostgresSuperuser' }))

    expect(screen.getByText('Bypasses RLS and can return all rows.')).toBeVisible()
    expect(setRole).toHaveBeenCalledWith(undefined)
  })
})
