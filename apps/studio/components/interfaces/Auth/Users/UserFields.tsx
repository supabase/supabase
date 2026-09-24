import dayjs from 'dayjs'
import { cn } from 'ui'

import { LogFieldRow } from '@/components/interfaces/UnifiedLogs/components/LogFieldRow'
import type { User } from '@/data/auth/users-infinite-query'

const DATE_FORMAT = 'DD MMM, YYYY HH:mm'

const formatDate = (value?: string | null) => (value ? dayjs(value).format(DATE_FORMAT) : '')

function getUserFields(user: User): { label: string; value: string }[] {
  const isBanned = !!user.banned_until && dayjs(user.banned_until).isAfter(dayjs())
  return [
    { label: 'User ID', value: user.id ?? '' },
    { label: 'Email', value: user.email ?? '' },
    { label: 'Phone', value: user.phone ?? '' },
    { label: 'Providers', value: user.providers.join(', ') },
    { label: 'Created', value: formatDate(user.created_at) },
    { label: 'Updated', value: formatDate(user.updated_at) },
    { label: 'Invited', value: formatDate(user.invited_at) },
    { label: 'Confirmation sent', value: formatDate(user.confirmation_sent_at) },
    { label: 'Confirmed', value: formatDate(user.confirmed_at) },
    { label: 'Last signed in', value: formatDate(user.last_sign_in_at) },
    { label: 'SSO', value: user.is_sso_user ? 'Yes' : 'No' },
    { label: 'Anonymous', value: user.is_anonymous ? 'Yes' : 'No' },
    { label: 'Banned until', value: isBanned ? formatDate(user.banned_until) : '' },
  ]
}

/** A user's details as key/value rows; click a row to copy its value. */
export function UserFields({
  user,
  onFilterByUser,
  className,
}: {
  user: User
  /** Adds "Add filter" to the User ID row, e.g. to filter logs to this user. */
  onFilterByUser?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col py-1', className)}>
      {getUserFields(user).map(({ label, value }) => (
        <LogFieldRow
          key={label}
          label={label}
          value={value}
          filterFields={[]}
          disabled={!value}
          onAddFilter={label === 'User ID' ? onFilterByUser : undefined}
        >
          {value ? (
            <span className="min-w-0 truncate text-right font-mono text-sm leading-5">{value}</span>
          ) : (
            <span className="font-mono text-sm leading-5 text-foreground-muted">—</span>
          )}
        </LogFieldRow>
      ))}
    </div>
  )
}
