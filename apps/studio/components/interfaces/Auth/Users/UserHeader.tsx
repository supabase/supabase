import { Copy } from 'lucide-react'
import { cn } from 'ui'

import { PANEL_PADDING } from './Users.constants'
import { getDisplayName } from './Users.utils'
import CopyButton from '@/components/ui/CopyButton'
import { User } from '@/data/auth/users-infinite-query'

export const UserHeader = ({ user }: { user: User }) => {
  const displayName = getDisplayName(user)
  const hasDisplayName = displayName !== '-'

  const isPhoneAuth = user.phone !== null
  const isAnonUser = user.is_anonymous

  return (
    <div className={cn(PANEL_PADDING)}>
      {isPhoneAuth ? (
        <div className="flex min-w-0 items-start gap-x-1">
          <p className="min-w-0 [overflow-wrap:anywhere]">{user.phone}</p>
          <CopyButton
            iconOnly
            variant="text"
            icon={<Copy />}
            className="shrink-0 px-1"
            text={user?.phone ?? ''}
          />
        </div>
      ) : isAnonUser ? (
        <>
          <p>Anonymous user</p>
          <div className="flex min-w-0 items-start gap-x-1">
            <p className="text-foreground-light min-w-0 text-sm [overflow-wrap:anywhere]">
              {user.id}
            </p>
            <CopyButton
              iconOnly
              variant="text"
              icon={<Copy />}
              className="shrink-0 px-1"
              text={user?.id ?? ''}
            />
          </div>
        </>
      ) : (
        <>
          {hasDisplayName && <p>{displayName}</p>}
          <div className="flex min-w-0 items-start gap-x-1">
            <p
              className={cn(
                'min-w-0 [overflow-wrap:anywhere]',
                hasDisplayName ? 'text-foreground-light text-sm' : 'text-foreground'
              )}
            >
              {user.email}
            </p>
            <CopyButton
              iconOnly
              variant="text"
              icon={<Copy />}
              className="shrink-0 px-1"
              text={user?.email ?? ''}
            />
          </div>
        </>
      )}
    </div>
  )
}
