import { observer } from 'mobx-react-lite'
import { Dispatch, Fragment, SetStateAction } from 'react'

import { useParams } from 'common/hooks'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization, useStore } from 'hooks'
import { useProfile } from 'lib/profile'
import { Role } from 'types'
import { Button, Loading } from 'ui'

export interface RolesViewProps {
  selectRole: Dispatch<SetStateAction<Role | undefined>>
}

const RolesView = ({ selectRole }: RolesViewProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const selectedOrganization = useSelectedOrganization()

  const { profile } = useProfile()
  const { data: permissions } = usePermissionsQuery()
  const {
    data: rolesData,
    error: rolesError,
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    isSuccess: isSuccessRoles,
  } = useOrganizationRolesQuery({ slug })
  const roles = rolesData?.roles.sort((a, b) => a.name.localeCompare(b.name)) ?? []

  return (
    <>
      {isErrorRoles && (
        <AlertError error={rolesError} subject="Failed to retrieve organization roles" />
      )}

      {isSuccessRoles && (
        <div className="rounded w-full">
          <Loading active={!roles}>
            <Table
              head={[
                <Table.th key="header-name">Role</Table.th>,
                <Table.th key="header-description">Description</Table.th>,
                <Table.th key="header-action"></Table.th>,
              ]}
              body={[
                ...roles.map((x: Role, i: number) => {
                  const isOwnerRole = x.name.toLowerCase() === 'owner'
                  const isDefaultRole = [
                    'owner',
                    'administrator',
                    'developer',
                    'none',
                    'read-only',
                    'billing-only',
                  ].includes(x.name.toLowerCase())
                  const allowCustomPermission = !isDefaultRole
                  const allowDelete = !isOwnerRole
                  return (
                    <Fragment key={`member-row-${i}`}>
                      <Table.tr>
                        <Table.td>
                          <div className="flex items-center space-x-4">
                            <div>{x.name}</div>
                          </div>
                        </Table.td>

                        <Table.td>
                          <div className="flex items-center space-x-4">
                            <div>{x.description}</div>
                          </div>
                        </Table.td>

                        <Table.td>
                          <div className="flex space-x-4">
                            {allowCustomPermission && <Button>Edit</Button>}
                            {allowCustomPermission && (
                              <Button onClick={() => selectRole(x)}>Permissions</Button>
                            )}
                            {allowDelete && <Button type={'danger'}>Delete</Button>}
                          </div>
                        </Table.td>
                      </Table.tr>
                    </Fragment>
                  )
                }),
              ]}
            />
          </Loading>
        </div>
      )}
    </>
  )
}

export default observer(RolesView)
