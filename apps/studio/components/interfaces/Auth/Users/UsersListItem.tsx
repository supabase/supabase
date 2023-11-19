import { Badge } from 'ui'

import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import Table from 'components/to-be-cleaned/Table'
import { User } from 'data/auth/users-query'
import UserDropdown from './UserDropdown'
import { getDateFromIsoString } from './Users.utils'

interface UserListItemProps {
  user: User
  canRemoveUser: boolean
  canRemoveMFAFactors: boolean
}

const UserListItem = ({ user, canRemoveUser, canRemoveMFAFactors }: UserListItemProps) => {
  const isUserConfirmed = user.email_confirmed_at || user.phone_confirmed_at
  const createdAt = getDateFromIsoString(user.created_at)
  const lastSignedIn = getDateFromIsoString(user.last_sign_in_at)

  return (
    <Table.tr className="relative" key={user.id}>
      <Table.td className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{!user.email ? '-' : user.email}</span>
        </div>
      </Table.td>
      <Table.td className="whitespace-nowrap">
        <span className="text-foreground">{!user.phone ? '-' : user.phone}</span>
      </Table.td>
      <Table.td className="table-cell">
        <span className="capitalize text-foreground">{user?.raw_app_meta_data?.provider}</span>
      </Table.td>
      <Table.td className="table-cell">
        <span className="text-foreground">{createdAt?.format('DD MMM, YYYY HH:mm')}</span>
      </Table.td>
      <Table.td className="table-cell">
        {!isUserConfirmed ? (
          <Badge color="yellow">Waiting for verification..</Badge>
        ) : user.last_sign_in_at ? (
          lastSignedIn?.format('DD MMM, YYYY HH:mm')
        ) : (
          'Never'
        )}
      </Table.td>
      <Table.td className="table-cell">
        <div className="flex max-w-[72px] items-baseline">
          <SimpleCodeBlock metastring="" className="font-xs bash">
            {user.id}
          </SimpleCodeBlock>
          <div>...</div>
        </div>
      </Table.td>
      <Table.td className="table-cell">
        <UserDropdown
          user={user}
          canRemoveUser={canRemoveUser}
          canRemoveMFAFactors={canRemoveMFAFactors}
        />
      </Table.td>
    </Table.tr>
  )
}

export default UserListItem
