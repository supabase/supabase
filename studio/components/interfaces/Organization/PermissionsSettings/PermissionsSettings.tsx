import { useState } from 'react'

import { useParams } from 'common/hooks'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainerLegacy,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { Role } from 'types'
import { Button } from 'ui'
import NewPermissionsButton from './NewPermissionsButton'
import NewRoleButton from './NewRoleButton'
import RolePermissionsView from './RolePermissionsView'
import RolesView from './RolesView'

const PermissionsSettings = () => {
  const { slug } = useParams()
  const { data: rolesData } = useOrganizationRolesQuery({ slug })
  const [selectedRole, setRole] = useState<Role | undefined>(undefined)
  const roles = rolesData?.roles ?? []

  return (
    <ScaffoldContainerLegacy>
      <ScaffoldFilterAndContent>
        <ScaffoldActionsContainer className="justify-between">
          <ScaffoldActionsGroup>
            <div>
              {selectedRole ? (
                <div className="flex flex-col space-y-4">
                  <div className="flex space-x-4">
                    <Button
                      type={'text'}
                      onClick={() => {
                        setRole(undefined)
                      }}
                    >
                      Back
                    </Button>
                    <NewPermissionsButton roleId={selectedRole.id} />
                  </div>
                  <div>{selectedRole.name}</div>
                </div>
              ) : (
                <NewRoleButton roles={roles} />
              )}
            </div>
          </ScaffoldActionsGroup>
        </ScaffoldActionsContainer>
        <ScaffoldSectionContent className="w-full">
          {selectedRole ? (
            <RolePermissionsView roleId={selectedRole.id} />
          ) : (
            <RolesView selectRole={setRole} />
          )}
        </ScaffoldSectionContent>
      </ScaffoldFilterAndContent>
    </ScaffoldContainerLegacy>
  )
}

export default PermissionsSettings
