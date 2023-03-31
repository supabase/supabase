import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge } from 'ui'

import Table from 'components/to-be-cleaned/Table'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import UserDropdown from './UserDropdown'
import { getDateFromIsoString } from './Users.utils'
import { User } from './Users.types'

interface Props {
  user: User
  canRemoveUser: boolean
  canRemoveMFAFactors: boolean
}

const UserListItem: FC<Props> = ({ user, canRemoveUser, canRemoveMFAFactors }) => {
  const isUserConfirmed = user.email_confirmed_at || user.phone_confirmed_at
  const createdAt = getDateFromIsoString(user.created_at)
  const lastSignedIn = getDateFromIsoString(user.last_sign_in_at)

  return (
    <Table.tr className="relative" key={user.id}>
      <Table.td className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-scale-1200">{!user.email ? '-' : user.email}</span>
        </div>
      </Table.td>
      <Table.td className="whitespace-nowrap">
        <span className="text-scale-1200">{!user.phone ? '-' : user.phone}</span>
      </Table.td>
      <Table.td className="table-cell">
        <span className="capitalize text-scale-1200">
          {user?.raw_app_meta_data?.provider || user?.app_metadata?.provider}
        </span>
      </Table.td>
      <Table.td className="table-cell">
        <span className="text-scale-1200">{createdAt?.format('DD MMM, YYYY HH:mm')}</span>
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
      <Table.td className="text-right">
        <UserDropdown
          user={user}
          canRemoveUser={canRemoveUser}
          canRemoveMFAFactors={canRemoveMFAFactors}
        />
      </Table.td>
    </Table.tr>
  )
}

export default observer(UserListItem)
