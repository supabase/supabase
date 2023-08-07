import * as Tooltip from '@radix-ui/react-tooltip'
import { observer } from 'mobx-react-lite'
import Image from 'next/image'
import { Fragment, useState } from 'react'

import { useParams } from 'common/hooks'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrganizationDetailQuery } from 'data/organizations/organization-detail-query'
import { useOrganizationMemberUpdateMutation } from 'data/organizations/organization-member-update-mutation'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization, useStore } from 'hooks'
import { useProfile } from 'lib/profile'
import { Role } from 'types'
import { Badge, Button, IconAlertCircle, IconLoader, IconUser, Listbox, Loading, Modal } from 'ui'
import { getUserDisplayName, isInviteExpired } from '../Organization.utils'

interface SelectedRole extends Role {}

const RolesView = () => {
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
  const roles = rolesData?.roles ?? []

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

export default observer(RolesView)
