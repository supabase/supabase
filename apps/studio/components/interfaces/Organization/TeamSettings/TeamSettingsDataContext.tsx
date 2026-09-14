import type { PropsWithChildren } from 'react'
import { createContext, useContext, useMemo } from 'react'

import type { OrganizationRolesResponse } from '@/data/organization-members/organization-roles-query'
import type { OrganizationMember } from '@/data/organizations/organization-members-query'
import type { OrganizationBase } from '@/data/organizations/organizations-query'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import type { Permission } from '@/types'

type TeamSettingsDataContextValue = {
  members: OrganizationMember[]
  roles: OrganizationRolesResponse | undefined
  isLoadingRoles: boolean
  orgProjects: OrgProject[]
  permissions: Permission[] | undefined
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
  orgProjects,
  permissions,
  selectedOrganization,
  organizationMembersDeletionEnabled,
  onManageAccess,
}: PropsWithChildren<TeamSettingsDataContextValue>) => {
  const contextValue = useMemo(
    () => ({
      members,
      roles,
      isLoadingRoles,
      orgProjects,
      permissions,
      selectedOrganization,
      organizationMembersDeletionEnabled,
      onManageAccess,
    }),
    [
      members,
      roles,
      isLoadingRoles,
      orgProjects,
      permissions,
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
