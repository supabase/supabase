import { useState } from 'react'

import { getRoleSelectionUpdate, getSelectedRoleOption } from './RoleImpersonationSelector.utils'
import type { PostgrestRole } from '@/lib/role-impersonation'
import type { RoleImpersonationController } from '@/state/role-impersonation-state'

export const useRoleImpersonationSelection = (state: RoleImpersonationController) => {
  const [selectedOption, setSelectedOption] = useState<PostgrestRole>(() =>
    getSelectedRoleOption(state.role)
  )

  function onSelectedChange(value: PostgrestRole) {
    const update = getRoleSelectionUpdate(value)
    if (update.shouldSetRole) {
      void state.setRole(update.role)
    }

    setSelectedOption(value)
  }

  return { selectedOption, onSelectedChange }
}
