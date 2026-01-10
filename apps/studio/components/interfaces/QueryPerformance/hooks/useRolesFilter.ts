import { useMemo } from 'react'

import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

import {
  APP_ACCESS_ROLES,
  ROLE_DESCRIPTIONS,
  RoleGroup,
  SUPABASE_SYSTEM_ROLES,
} from '../constants/roles'

export type RoleWithDescription = {
  name: string
  description?: string
}

export const useRolesFilter = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data, isPending: isLoadingRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const roles = useMemo((): RoleWithDescription[] => {
    return (data ?? [])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((role) => ({
        ...role,
        description: ROLE_DESCRIPTIONS[role.name],
      }))
  }, [data])

  const roleGroups = useMemo((): RoleGroup[] => {
    return [
      {
        name: 'App Access',
        options: roles.filter((r) => APP_ACCESS_ROLES.includes(r.name)).map((r) => r.name),
      },
      {
        name: 'Supabase System',
        options: roles.filter((r) => SUPABASE_SYSTEM_ROLES.includes(r.name)).map((r) => r.name),
      },
      {
        name: 'Custom',
        options: roles
          .filter(
            (r) => !APP_ACCESS_ROLES.includes(r.name) && !SUPABASE_SYSTEM_ROLES.includes(r.name)
          )
          .map((r) => r.name),
      },
    ]
  }, [roles])

  return {
    roles,
    roleGroups,
    isLoadingRoles,
  }
}
