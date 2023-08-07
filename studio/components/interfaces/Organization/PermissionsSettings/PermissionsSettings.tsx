import { useParams } from 'common/hooks'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import {
  ScaffoldActionsGroup,
  ScaffoldContainerLegacy,
  ScaffoldFilterAndContent,
  ScaffoldActionsContainer,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import NewRoleButton from './NewRoleButton'
import RolesView from './RolesView'
import { useState } from 'react'
import { Role } from 'types'
import NewPermissionsButton from './NewPermissionsButton'
import RolePermissionsView from './RolePermissionsView'
import { Button } from 'ui'

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
