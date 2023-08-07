import { observer } from 'mobx-react-lite'
import { Fragment } from 'react'

import { useParams } from 'common/hooks'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { useSelectedOrganization, useStore } from 'hooks'
import { useProfile } from 'lib/profile'
import { BasePermission, Role } from 'types'
import { Button, Loading } from 'ui'
import { useOrganizationRolePermissionsQuery } from 'data/organizations/organization-role-permissions-query'

interface RolePermissionsViewProps {
  roleId: number
}

const RolePermissionsView = ({ roleId }: RolePermissionsViewProps) => {
  const { ui } = useStore()
  const { slug } = useParams()

  const {
    data: roleDetails,
    error: roleDetailsError,
    isLoading: isLoadingRoleDetails,
    isError: isErrorRoleDetails,
    isSuccess: isSuccessRoleDetails,
  } = useOrganizationRolePermissionsQuery({ slug, roleId })
  const permissions = roleDetails?.permissions ?? []

  return (
    <>
      {isErrorRoleDetails && (
        <AlertError
          error={roleDetailsError}
          subject="Failed to retrieve organization role permissions"
        />
      )}

      {isSuccessRoleDetails && (
        <div className="rounded w-full">
          <Loading active={!roleDetails}>
            <Table
              head={[
                <Table.th key="header-name">Actions</Table.th>,
                <Table.th key="header-description">Resources</Table.th>,
                <Table.th key="header-name">Restrictive</Table.th>,
                <Table.th key="header-description">Condition</Table.th>,
                <Table.th key="header-action"></Table.th>,
              ]}
              body={[
                ...permissions.map((x: BasePermission, i: number) => {
                  console.log(JSON.stringify(x.condition))
                  return (
                    <Fragment key={`member-row-${i}`}>
                      <Table.tr>
                        <Table.td>
                          <div className="flex items-center space-x-4">
                            <div>{JSON.stringify(x.actions)}</div>
                          </div>
                        </Table.td>

                        <Table.td>
                          <div className="flex items-center space-x-4">
                            <div>{JSON.stringify(x.resources)}</div>
                          </div>
                        </Table.td>

                        <Table.td>
                          <div className="flex items-center space-x-4">
                            <div>{x.restrictive}</div>
                          </div>
                        </Table.td>

                        <Table.td>
                          <div className="flex items-center space-x-4">
                            <div>{x.condition ? JSON.stringify(x.condition) : ''}</div>
                          </div>
                        </Table.td>

                        <Table.td>
                          <div className="flex space-x-4">
                            <Button>Edit</Button>
                            <Button type={'danger'}>Delete</Button>
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

export default observer(RolePermissionsView)
