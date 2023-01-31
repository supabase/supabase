import { useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { IconAlertCircle, Loading } from 'ui'

import { PageContext } from 'pages/project/[ref]/auth/users'
import Table from 'components/to-be-cleaned/Table'
import UserListItem from './UsersListItem'
import UsersPagination from './UsersPagination'
import { checkPermissions } from 'hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'

const UsersList = ({}) => {
  const PageState: any = useContext(PageContext)

  // Check once on the top level, rather than checking for every row
  const canRemoveUser = checkPermissions(PermissionAction.TENANT_SQL_DELETE, 'auth.users')
  const canRemoveMFAFactors = checkPermissions(
    PermissionAction.TENANT_SQL_DELETE,
    'auth.mfa_factors'
  )

  return (
    <Loading active={PageState.usersLoading}>
      <Table
        head={
          <>
            <Table.th>Email</Table.th>
            <Table.th>Phone</Table.th>
            <Table.th className="table-cell">Provider</Table.th>
            <Table.th className="table-cell">Created</Table.th>
            <Table.th className="table-cell">Last Sign In</Table.th>
            <Table.th className="table-cell">User UID</Table.th>
            <Table.th></Table.th>
          </>
        }
        body={
          <>
            {!PageState.usersLoading && PageState.users.length == 0 && (
              <Table.tr>
                {/* @ts-ignore */}
                <Table.td
                  colSpan={7}
                  className="h-14 whitespace-nowrap border-t p-4 text-sm leading-5 text-gray-300"
                >
                  <div className="flex items-center space-x-3 opacity-75">
                    <IconAlertCircle size={16} strokeWidth={2} />
                    <p className="text-scale-1000">
                      {PageState.filterKeywords
                        ? `No users matched the search query "${PageState.filterKeywords}"`
                        : 'No users in your project yet'}
                    </p>
                  </div>
                </Table.td>
              </Table.tr>
            )}
            {PageState.users.length > 0 &&
              PageState.users.map((x: any) => (
                <UserListItem
                  key={x.id}
                  user={x}
                  canRemoveUser={canRemoveUser}
                  canRemoveMFAFactors={canRemoveMFAFactors}
                />
              ))}
            <Table.tr>
              <Table.td colSpan={7}>
                <UsersPagination />
              </Table.td>
            </Table.tr>
          </>
        }
      />
    </Loading>
  )
}

export default observer(UsersList)
