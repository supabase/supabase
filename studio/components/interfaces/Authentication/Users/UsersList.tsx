import { useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Loading } from '@supabase/ui'

import { PageContext } from 'pages/project/[ref]/auth/users'
import Table from 'components/to-be-cleaned/Table'
import UserListItem from './UsersListItem'
import UsersPagination from './UsersPagination'

const UsersList = ({}) => {
  const PageState: any = useContext(PageContext)

  return (
    <Loading active={PageState.usersLoading}>
      <Table
        head={
          <>
            <Table.th>Email</Table.th>
            <Table.th>Phone</Table.th>
            <Table.th className="hidden 2xl:table-cell">Provider</Table.th>
            <Table.th className="hidden 2xl:table-cell">Created</Table.th>
            <Table.th className="hidden xl:table-cell">Last Sign In</Table.th>
            <Table.th className="hidden lg:table-cell">User UID</Table.th>
            <Table.th></Table.th>
          </>
        }
        body={
          <>
            {PageState.users.length == 0 && (
              <Table.tr>
                {/* @ts-ignore */}
                <Table.td
                  colSpan={7}
                  className="h-28 p-4 whitespace-nowrap border-t leading-5 text-gray-300 text-sm"
                ></Table.td>
              </Table.tr>
            )}
            {PageState.users.length > 0 &&
              PageState.users.map((x: any) => <UserListItem key={x.id} user={x} />)}
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
