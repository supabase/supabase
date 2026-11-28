import { useParams } from 'common'
import dayjs from 'dayjs'
import { ChevronDownIcon } from 'lucide-react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { AlertError } from '@/components/ui/AlertError'
import {
  JitDbAccessStatusData,
  useJitDbAccessStatusQuery,
} from '@/data/jit-db-access/jit-db-access-status-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

const ACCESS_TITLE = "You have access to the project's database"

export const JitDbAccessInfo = () => {
  const { ref: projectRef } = useParams()
  const { data: jitDbAccess, error, isError } = useJitDbAccessStatusQuery({ projectRef })

  const { can: canManageJitDbAccess } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_JIT_WRITE
  )

  if (!jitDbAccess) return null

  if (isError) {
    return (
      <AlertError
        className="border-0 rounded-none"
        subject="Failed to retrieve access status"
        error={error}
      />
    )
  } else if (jitDbAccess.user_id === undefined) {
    if (!canManageJitDbAccess) return <NoAccess />
    else return null
  } else if (jitDbAccess.user_roles.length === 1) {
    return <SingleRoleAccess role={jitDbAccess.user_roles[0]} />
  } else {
    return <MultiRoleAccess roles={jitDbAccess.user_roles} />
  }
}

type JitRole = JitDbAccessStatusData['user_roles'][number]

// A role without `expires_at` never expires, so it keeps access alive. Units in unix seconds.
const isRoleExpired = (role: JitRole) =>
  role.expires_at !== undefined && dayjs.unix(role.expires_at).isBefore(dayjs())

const SingleRoleAccess = ({ role }: { role: JitRole }) => {
  const isExpired = isRoleExpired(role)

  const { can: canManageJitDbAccess } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_JIT_WRITE
  )

  if (isExpired) {
    if (!canManageJitDbAccess) return <ExpiredAccess />
    else return null
  }

  return (
    <Admonition
      type="default"
      showIcon={false}
      className={cn('rounded-none', canManageJitDbAccess ? 'border-x-0 border-t-0' : 'border-none')}
      title={ACCESS_TITLE}
      description={
        <div className="flex items-center gap-x-2">
          <span>
            <span>As</span> <code>{role.role}</code>
          </span>
          {role.expires_at && (
            <>
              <span>·</span>
              <span>
                Expires on{' '}
                <TimestampInfo className="text-sm" utcTimestamp={role.expires_at * 1000} />
              </span>
            </>
          )}
        </div>
      }
    />
  )
}

const MultiRoleAccess = ({ roles }: { roles: JitDbAccessStatusData['user_roles'] }) => {
  // A role without `expires_at` never expires, so it keeps access alive
  const isExpired = roles.length > 0 && roles.every(isRoleExpired)

  // Earliest expiry among roles that are still active (unix seconds)
  const upcomingExpiries = roles.flatMap((role) =>
    role.expires_at !== undefined && !isRoleExpired(role) ? [role.expires_at] : []
  )
  const nextExpiry = upcomingExpiries.length > 0 ? Math.min(...upcomingExpiries) : undefined

  const { can: canManageJitDbAccess } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_JIT_WRITE
  )

  if (isExpired) {
    if (!canManageJitDbAccess) return <ExpiredAccess />
    else return null
  }

  return (
    <Collapsible className={canManageJitDbAccess ? 'border-b' : ''}>
      <CollapsibleTrigger
        type="button"
        className="flex items-center justify-between gap-x-2 w-full py-4 px-4 text-left cursor-pointer [&[data-state=open]>svg]:-rotate-180!"
      >
        <span className="block text-sm">
          <span className="block mb-0.5">{ACCESS_TITLE}</span>
          <span className="flex items-center gap-x-2 text-foreground-light">
            <span>Assigned {roles.length} roles</span>
            {nextExpiry !== undefined && (
              <>
                <span>·</span>
                <span>
                  <span>Next expiry on</span>{' '}
                  <TimestampInfo className="text-sm" utcTimestamp={nextExpiry * 1000} />
                </span>
              </>
            )}
          </span>
        </span>
        <ChevronDownIcon className="transition-transform" size={14} />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-closed:animate-collapsible-up-clipped data-open:animate-collapsible-down-clipped motion-reduce:animate-none">
        {roles.map((role) => {
          return (
            <div key={role.role} className="py-2 px-4 first:pt-0 text-foreground-light">
              <p className="text-sm flex items-center gap-x-2">
                <code>{role.role}</code>
                <span>·</span>
                {role.expires_at && (
                  <span>
                    Expires on{' '}
                    <TimestampInfo className="text-sm" utcTimestamp={role.expires_at * 1000} />
                  </span>
                )}
              </p>
            </div>
          )
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}

const ExpiredAccess = () => {
  const { can: canManageJitDbAccess } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_JIT_WRITE
  )

  return (
    <Admonition
      type="default"
      className={cn('rounded-none', canManageJitDbAccess ? 'border-x-0 border-t-0' : 'border-none')}
      title="Your access to the project's database is expired"
      description="Contact your project's owner or administrator for renewed access if required."
    />
  )
}

const NoAccess = () => {
  return (
    <Admonition
      type="default"
      showIcon={false}
      className="rounded-none border-none"
      title="You need additional permissions to manage temporary database access"
      description="Contact your project's owner or administrator for assistance."
    />
  )
}
