import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IconAlertCircle, Loading } from 'ui'

import Table from 'components/to-be-cleaned/Table'
import { User } from 'data/auth/users-query'
import { useCheckPermissions } from 'hooks'
import UserListItem from './UsersListItem'
import UsersPagination from './UsersPagination'

interface UsersListProps {
  page: number
  setPage: (page: number) => void
  keywords: string
  verified?: 'verified' | 'unverified'

  total: number
  users: User[]
  isLoading: boolean
  isSuccess: boolean
}

const UsersList = ({
  page,
  setPage,
  keywords,
  total,
  users,
  isLoading,
  isSuccess,
}: UsersListProps) => {
  // Check once on the top level, rather than checking for every row
  const canRemoveUser = useCheckPermissions(PermissionAction.TENANT_SQL_DELETE, 'auth.users')
  const canRemoveMFAFactors = useCheckPermissions(
    PermissionAction.TENANT_SQL_DELETE,
    'auth.mfa_factors'
  )

  return (
    <Loading active={isLoading}>
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
            {isSuccess && users.length == 0 && (
              <Table.tr>
                {/* @ts-ignore */}
                <Table.td
                  colSpan={7}
                  className="h-14 whitespace-nowrap border-t p-4 text-sm leading-5 text-gray-300"
                >
                  <div className="flex items-center space-x-3 opacity-75">
                    <IconAlertCircle size={16} strokeWidth={2} />
                    <p className="text-foreground-light">
                      {keywords
                        ? `No users matched the search query "${keywords}"`
                        : 'No users in your project yet'}
                    </p>
                  </div>
                </Table.td>
              </Table.tr>
            )}
            {isSuccess &&
              users.length > 0 &&
              users.map((x: any) => (
                <UserListItem
                  key={x.id}
                  user={x}
                  canRemoveUser={canRemoveUser}
                  canRemoveMFAFactors={canRemoveMFAFactors}
                />
              ))}
            <Table.tr>
              <Table.td colSpan={7}>
                <UsersPagination total={total} page={page} setPage={setPage} />
              </Table.td>
            </Table.tr>
          </>
        }
      />
    </Loading>
  )
}

export default UsersList
