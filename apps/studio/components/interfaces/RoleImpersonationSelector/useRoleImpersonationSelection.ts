import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getRoleSelectionUpdate, getSelectedRoleOption } from './RoleImpersonationSelector.utils'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { PostgrestRole } from '@/lib/role-impersonation'
import { useTrack } from '@/lib/telemetry/track'
import type { RoleImpersonationController } from '@/state/role-impersonation-state'

const ROLE_TELEMETRY_VALUE = {
  service_role: 'postgres',
  anon: 'anon',
  authenticated: 'authenticated',
} as const satisfies Record<PostgrestRole, 'postgres' | 'anon' | 'authenticated'>

export type RoleImpersonationTelemetrySurface = 'sql_editor' | 'table_editor'

/**
 * @param telemetrySurface The editor the selector is in. A role pick is tracked only when it
 * is set, so other users of the selector send nothing.
 */
export const useRoleImpersonationSelection = (
  state: RoleImpersonationController,
  telemetrySurface?: RoleImpersonationTelemetrySurface
) => {
  const track = useTrack()
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
    if (telemetrySurface !== undefined) {
      track('role_impersonation_updated', {
        role: ROLE_TELEMETRY_VALUE[value],
        surface: telemetrySurface,
      })
    }

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
