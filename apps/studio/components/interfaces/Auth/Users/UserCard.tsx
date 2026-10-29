import { ChevronRightIcon, UserRoundIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, AvatarFallback, AvatarImage, cn } from 'ui'

import { getUserInitials, getUserPrimaryLabel } from './UserCard.utils'
import { getAvatarUrl, getDisplayName } from './Users.utils'
import type { User } from '@/data/auth/users-infinite-query'

interface UserCardProps {
  user: User
  variant?: 'default' | 'outline'
  href?: string
  linkLabel?: string
  actions?: ReactNode
  className?: string
}

export function UserCard({
  user,
  variant = 'default',
  href,
  linkLabel,
  actions,
  className,
}: UserCardProps) {
  const primaryLabel = getUserPrimaryLabel(user)
  const hasDisplayName = !!getDisplayName(user, '').trim()
  const secondaryLabel = hasDisplayName ? (user.email ?? user.phone) : undefined
  const initials = getUserInitials(user)

  return (
    <div
      className={cn(
        'relative flex min-w-0 items-center gap-3 px-4 py-3',
        variant === 'outline' && 'rounded-md border border-strong px-3 py-2.5',
        !!href && 'transition hover:border-foreground-muted hover:bg-surface-100',
        className
      )}
    >
      {href && (
        <a
          href={href}
          aria-label={linkLabel ?? primaryLabel}
          className={cn(
            'absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-muted',
            variant === 'outline' && 'rounded-md'
          )}
        />
      )}
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={getAvatarUrl(user)} alt="" />
        <AvatarFallback className="bg-surface-300 text-xs text-foreground-light">
          {initials || <UserRoundIcon size={14} strokeWidth={1.5} aria-hidden />}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-sm text-foreground" title={primaryLabel}>
          {primaryLabel}
        </p>
        {secondaryLabel && (
          <p className="truncate text-xs text-foreground-lighter" title={secondaryLabel}>
            {secondaryLabel}
          </p>
        )}
      </div>
      {actions && <div className="relative flex shrink-0 items-center gap-1">{actions}</div>}
      {href && (
        <ChevronRightIcon
          size={14}
          strokeWidth={1.5}
          aria-hidden
          className="shrink-0 text-foreground-lighter"
        />
      )}
    </div>
  )
}
