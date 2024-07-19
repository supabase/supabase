import { PermissionAction } from '@supabase/shared-types/out/constants'

import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import type { User } from 'data/auth/users-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import type { ResponseError } from 'types'
import UsersSidePanel from './UserSidePanel'
import UserListItem from './UsersListItem'
import UsersListItemSkeleton from './UsersListItemSkeleton'
import UsersPagination from './UsersPagination'

interface UsersListProps {
  page: number
  setPage: (page: number) => void
  keywords: string
  total: number
  users: User[]
  isLoading: boolean
  isSuccess: boolean
  isFetchingNextPage: boolean
  error: ResponseError | null
}

const UsersList = ({
  page,
  setPage,
  keywords,
  total,
  users,
  isLoading,
  isSuccess,
  isFetchingNextPage,
  error,
}: UsersListProps) => {
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined)
  const [userSidePanelOpen, setUserSidePanelOpen] = useState(false)

  // Check once on the top level, rather than checking for every row
  const canSendMagicLink = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'send_magic_link')
  const canSendRecovery = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'send_recovery')
  const canSendOtp = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'send_otp')
  const canRemoveUser = useCheckPermissions(PermissionAction.TENANT_SQL_DELETE, 'auth.users')
  const canRemoveMFAFactors = useCheckPermissions(
    PermissionAction.TENANT_SQL_DELETE,
    'auth.mfa_factors'
  )

  return (
    <Table
      head={
        <>
          <Table.th>Display Name</Table.th>
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
          {isLoading && (
            <>
              <UsersListItemSkeleton />
              <UsersListItemSkeleton />
              <UsersListItemSkeleton />
              <UsersListItemSkeleton />
            </>
          )}
          {error && <AlertError error={error} subject="Failed to retrieve users" />}
          {isSuccess && users.length === 0 && (
            <Table.tr>
              <Table.td
                colSpan={8}
                className="h-14 whitespace-nowrap border-t p-4 text-sm leading-5 text-gray-300"
              >
                <div className="flex items-center space-x-3 opacity-75">
                  <AlertCircle size={16} strokeWidth={2} />
                  <p className="text-foreground-light">
                    {keywords
                      ? `No users matched the search query "${keywords}"`
                      : 'No users in your project'}
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
                permissions={{
                  canRemoveUser,
                  canRemoveMFAFactors,
                  canSendMagicLink,
                  canSendRecovery,
                  canSendOtp,
                }}
                setSelectedUser={setSelectedUser}
                setUserSidePanelOpen={setUserSidePanelOpen}
              />
            ))}
          <Table.tr>
            <Table.td colSpan={8}>
              <UsersPagination
                total={total}
                page={page}
                setPage={setPage}
                isFetchingNextPage={isFetchingNextPage}
              />
            </Table.td>
          </Table.tr>

          <UsersSidePanel
            selectedUser={selectedUser}
            userSidePanelOpen={userSidePanelOpen}
            setUserSidePanelOpen={setUserSidePanelOpen}
          />
        </>
      }
    />
  )
}

export default UsersList
