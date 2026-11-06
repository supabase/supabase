import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getRoleSelectionUpdate, getSelectedRoleOption } from './RoleImpersonationSelector.utils'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { PostgrestRole } from '@/lib/role-impersonation'
import type { RoleImpersonationController } from '@/state/role-impersonation-state'

export const useRoleImpersonationSelection = (state: RoleImpersonationController) => {
  const [isAuthenticatedPending, setIsAuthenticatedPending] = useState(false)

  useEffect(() => {
    if (
      state.role?.type === 'postgrest' &&
      state.role.role === 'authenticated' &&
      isAuthenticatedPending
    ) {
      setIsAuthenticatedPending(false)
    }
  }, [isAuthenticatedPending, state.role])

  const selectedOption = isAuthenticatedPending
    ? 'authenticated'
    : getSelectedRoleOption(state.role)

  async function onSelectedChange(value: PostgrestRole) {
    const update = getRoleSelectionUpdate(value)
    if (!update.shouldSetRole) {
      setIsAuthenticatedPending(true)
      return
    }

    try {
      await state.setRole(update.role)
      setIsAuthenticatedPending(false)
    } catch (error) {
      toast.error(`Failed to impersonate user: ${(error as StudioError).message}`)
    }
  }

  function keepAuthenticatedSelected() {
    setIsAuthenticatedPending(true)
  }

  return { selectedOption, onSelectedChange, keepAuthenticatedSelected }
}
