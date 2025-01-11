import { Copy } from 'lucide-react'

import CopyButton from 'components/ui/CopyButton'
import { User } from 'data/auth/users-infinite-query'
import { cn } from 'ui'
import { PANEL_PADDING } from './UserPanel'
import { getDisplayName } from './Users.utils'

export const UserHeader = ({ user }: { user: User }) => {
  const displayName = getDisplayName(user)
  const hasDisplayName = displayName !== '-'

  const isPhoneAuth = user.phone !== null
  const isAnonUser = user.is_anonymous

  return (
    <div className={cn(PANEL_PADDING)}>
      {isPhoneAuth ? (
        <div className="flex items-center gap-x-1">
          <p>{user.phone}</p>
          <CopyButton
            iconOnly
            type="text"
            icon={<Copy />}
            className="px-1"
            text={user?.phone ?? ''}
          />
        </div>
      ) : isAnonUser ? (
        <>
          <p>Anonymous user</p>
          <div className="flex items-center gap-x-1">
            <p className="text-foreground-light text-sm">{user.id}</p>
            <CopyButton
              iconOnly
              type="text"
              icon={<Copy />}
              className="px-1"
              text={user?.id ?? ''}
            />
          </div>
        </>
      ) : (
        <>
          {hasDisplayName && <p>{displayName}</p>}
          <div className="flex items-center gap-x-1">
            <p className={cn(hasDisplayName ? 'text-foreground-light text-sm' : 'text-foreground')}>
              {user.email}
            </p>
            <CopyButton
              iconOnly
              type="text"
              icon={<Copy />}
              className="px-1"
              text={user?.email ?? ''}
            />
          </div>
        </>
      )}
    </div>
  )
}
