import { useMemo } from 'react'

import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

import {
  APP_ACCESS_ROLES,
  isKnownRole,
  ROLE_INFO,
  RoleGroup,
  SUPABASE_SYSTEM_ROLES,
  type KnownRole,
} from '../constants/roles'

export type RoleWithDescription = {
  name: string
  displayName: string
  description?: string
}

export const useRolesFilter = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data, isPending: isLoadingRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const appAccessRolesSet = useMemo(() => new Set(APP_ACCESS_ROLES) as Set<string>, [])
  const supabaseSystemRolesSet = useMemo(() => new Set(SUPABASE_SYSTEM_ROLES) as Set<string>, [])

  const roles = useMemo((): RoleWithDescription[] => {
    return (data ?? [])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((role) => ({
        ...role,
        displayName: isKnownRole(role.name) ? ROLE_INFO[role.name].displayName : role.name,
        description: isKnownRole(role.name) ? ROLE_INFO[role.name].description : undefined,
      }))
  }, [data])

  const roleGroups = useMemo((): RoleGroup[] => {
    return [
      {
        name: 'App Access',
        options: roles.filter((r) => appAccessRolesSet.has(r.name)).map((r) => r.name),
      },
      {
        name: 'Supabase System',
        options: roles.filter((r) => supabaseSystemRolesSet.has(r.name)).map((r) => r.name),
      },
      {
        name: 'Custom',
        options: roles
          .filter((r) => !appAccessRolesSet.has(r.name) && !supabaseSystemRolesSet.has(r.name))
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
