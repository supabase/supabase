import { Check, Copy, X } from 'lucide-react'

import { User } from 'data/auth/users-query'
import { getDisplayName } from './Users.utils'
import { cn, Separator } from 'ui'
import { PANEL_PADDING } from './UserPanel'
import CopyButton from 'components/ui/CopyButton'

interface UserOverviewProps {
  user: User
}

export const UserOverview = ({ user }: UserOverviewProps) => {
  const displayName = getDisplayName(user)
  const hasDisplayName = displayName !== '-'
  const isPhoneAuth = user.phone !== null
  const isAnonUser = user.is_anonymous

  return (
    <div>
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
              <p
                className={cn(hasDisplayName ? 'text-foreground-light text-sm' : 'text-foreground')}
              >
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
      <Separator />
      <div className={cn('flex flex-col', PANEL_PADDING)}>
        <RowData property="Last signed in" value={'test'} />
        <RowData property="Created at" value={'test'} />
        <RowData property="Updated at" value={'test'} />
        <RowData property="User UID" value={user.id} />
        <RowData property="SSO" value={user.is_sso_user} />
      </div>
    </div>
  )
}

const RowData = ({ property, value }: { property: string; value?: string | boolean }) => {
  return (
    <div className="flex items-center gap-x-2 group">
      <p className="w-32 text-foreground-light text-sm">{property}</p>
      {typeof value === 'boolean' ? (
        <div className="h-[26px] flex items-center justify-center">
          {value ? (
            <div className="rounded-full w-4 h-4 dark:bg-white bg-black flex items-center justify-center">
              <Check size={11} className="text-contrast" strokeWidth={4} />
            </div>
          ) : (
            <X size={13} />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-x-2">
          <p className="text-sm">{value === undefined ? '-' : value}</p>
          {value !== undefined && (
            <CopyButton
              iconOnly
              type="text"
              icon={<Copy />}
              className="transition opacity-0 group-hover:opacity-100 px-1"
              text={value}
            />
          )}
        </div>
      )}
    </div>
  )
}
