import dayjs from 'dayjs'
import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, IconUser, Typography } from '@supabase/ui'
import Table from 'components/to-be-cleaned/Table'

import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import UserDropdown from './UserDropdown'

interface Props {
  user: any
}

const UserListItem: FC<Props> = ({ user }) => {
  const isUserConfirmed = user.email_confirmed_at || user.phone_confirmed_at
  return (
    <Table.tr key={user.id}>
      <Table.td className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-scale-1200">{!user.email ? '-' : user.email}</span>
        </div>
      </Table.td>
      <Table.td className="whitespace-nowrap">
        <span className="text-scale-1200">{!user.phone ? '-' : user.phone}</span>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1200 capitalize">
          {user?.raw_app_meta_data?.provider || user?.app_metadata?.provider}
        </span>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1200">
          {dayjs(user.created_at).format('DD MMM, YYYY HH:mm')}
        </span>
      </Table.td>
      <Table.td className="hidden xl:table-cell">
        {!isUserConfirmed ? (
          <Badge color="yellow">Waiting for verification..</Badge>
        ) : user.last_sign_in_at ? (
          dayjs(user.last_sign_in_at).format('DD MMM, YYYY HH:mm')
        ) : (
          'Never'
        )}
      </Table.td>
      <Table.td className="hidden lg:table-cell">
        <SimpleCodeBlock metastring="" className="font-xs bash">
          {user.id}
        </SimpleCodeBlock>
      </Table.td>
      <Table.td className="text-right">
        <UserDropdown user={user} />
      </Table.td>
    </Table.tr>
  )
}

export default observer(UserListItem)
