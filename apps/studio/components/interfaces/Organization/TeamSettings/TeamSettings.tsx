import { Search } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainerLegacy,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import { Input } from 'ui-patterns/DataInputs/Input'
import { InviteMemberButton } from './InviteMemberButton'
import MembersView from './MembersView'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'

export const TeamSettings = () => {
  const { organizationMembersCreate: organizationMembersCreationEnabled } = useIsFeatureEnabled([
    'organization_members:create',
  ])

  const { slug } = useParams()
  const { profile } = useProfile()
  const selectedOrganization = useSelectedOrganization()

  const { data: permissions } = usePermissionsQuery()
  const { data: rolesData } = useOrganizationRolesV2Query({ slug })

  const roles = rolesData?.org_scoped_roles ?? []

  const { rolesAddable } = useGetRolesManagementPermissions(
    selectedOrganization?.slug,
    roles,
    permissions ?? []
  )

  const [searchString, setSearchString] = useState('')

  const canAddMembers = rolesAddable.length > 0

  return (
    <ScaffoldContainerLegacy>
      <ScaffoldTitle>Team</ScaffoldTitle>
      <ScaffoldFilterAndContent>
        <ScaffoldActionsContainer className="w-full flex-col md:flex-row gap-2 justify-between">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={searchString}
            onChange={(e: any) => setSearchString(e.target.value)}
            name="email"
            id="email"
            placeholder="Filter members"
          />
          <ScaffoldActionsGroup className="w-full md:w-auto">
            {organizationMembersCreationEnabled &&
              canAddMembers &&
              profile !== undefined &&
              selectedOrganization !== undefined && <InviteMemberButton />}
          </ScaffoldActionsGroup>
        </ScaffoldActionsContainer>
        <ScaffoldSectionContent className="w-full">
          <MembersView searchString={searchString} />
        </ScaffoldSectionContent>
      </ScaffoldFilterAndContent>
    </ScaffoldContainerLegacy>
  )
}
