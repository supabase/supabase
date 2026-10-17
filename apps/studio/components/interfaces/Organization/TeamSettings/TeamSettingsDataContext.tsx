import type { PropsWithChildren } from 'react'
import { createContext, useContext, useMemo } from 'react'

import type { OrganizationRolesResponse } from '@/data/organization-members/organization-roles-query'
import type { OrganizationMember } from '@/data/organizations/organization-members-query'
import type { OrganizationBase } from '@/data/organizations/organizations-query'
import type { Permission } from '@/types'

type TeamSettingsDataContextValue = {
  members: OrganizationMember[]
  roles: OrganizationRolesResponse | undefined
  isLoadingRoles: boolean
  permissions: Permission[] | undefined
  totalNumOrgProjects: number
  selectedOrganization: OrganizationBase | undefined
  organizationMembersDeletionEnabled: boolean
  onManageAccess: (member: OrganizationMember) => void
}

const TeamSettingsDataContext = createContext<TeamSettingsDataContextValue | null>(null)

export const useTeamSettingsData = () => {
  const context = useContext(TeamSettingsDataContext)
  if (!context) {
    throw new Error('useTeamSettingsData must be used within TeamSettingsDataProvider')
  }
  return context
}

export const TeamSettingsDataProvider = ({
  children,
  members,
  roles,
  isLoadingRoles,
  permissions,
  totalNumOrgProjects,
  selectedOrganization,
  organizationMembersDeletionEnabled,
  onManageAccess,
}: PropsWithChildren<TeamSettingsDataContextValue>) => {
  const contextValue = useMemo(
    () => ({
      members,
      roles,
      isLoadingRoles,
      permissions,
      totalNumOrgProjects,
      selectedOrganization,
      organizationMembersDeletionEnabled,
      onManageAccess,
    }),
    [
      members,
      roles,
      isLoadingRoles,
      permissions,
      totalNumOrgProjects,
      selectedOrganization,
      organizationMembersDeletionEnabled,
      onManageAccess,
    ]
  )

  return (
    <TeamSettingsDataContext.Provider value={contextValue}>
      {children}
    </TeamSettingsDataContext.Provider>
  )
}
