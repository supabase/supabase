import { useDebounce } from '@uidotdev/usehooks'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { User, useUsersQuery } from 'data/auth/users-query'
import { User as IconUser, Loader2, Search, X } from 'lucide-react'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { Button, Input } from 'ui'
import { getAvatarUrl, getDisplayName } from '../Auth/Users/UserListItem.utils'

const UserImpersonationSelector = () => {
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText, 300)

  const { project } = useProjectContext()
  const { data, isSuccess, isLoading, isError, error, isFetching, isPreviousData } = useUsersQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      keywords: debouncedSearchText || undefined,
    },
    {
      keepPreviousData: true,
    }
  )

  const isSearching = isPreviousData && isFetching

  const state = useRoleImpersonationStateSnapshot()

  const impersonatingUser =
    state.role?.type === 'postgrest' && state.role.role === 'authenticated' && state.role.user

  function impersonateUser(user: User) {
    state.setRole({
      type: 'postgrest',
      role: 'authenticated',
      user,
    })
  }

  function stopImpersonating() {
    state.setRole(undefined)
  }

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-foreground text-base">
        {impersonatingUser
          ? `Impersonating ${getDisplayName(
              impersonatingUser,
              impersonatingUser.email ??
                impersonatingUser.phone ??
                impersonatingUser.id ??
                'Unknown'
            )}`
          : 'Impersonate a User'}
      </h2>
      <p className="text-sm text-foreground-light max-w-md">
        {!impersonatingUser
          ? "Select a user to respect your database's Row-Level Security policies for that particular user."
          : "Results will respect your database's Row-Level Security policies for this user."}
      </p>

      {!impersonatingUser ? (
        <div className="flex flex-col gap-2 mt-4">
          <Input
            className="table-editor-search border-none"
            icon={
              isSearching ? (
                <Loader2
                  className="animate-spin text-foreground-lighter"
                  size={16}
                  strokeWidth={1.5}
                />
              ) : (
                <Search className="text-foreground-lighter" size={16} strokeWidth={1.5} />
              )
            }
            placeholder="Search for a user.."
            onChange={(e) => setSearchText(e.target.value.trim())}
            value={searchText}
            size="small"
            actions={
              searchText && (
                <Button size="tiny" type="text" className="px-1" onClick={() => setSearchText('')}>
                  <X size={12} strokeWidth={2} />
                </Button>
              )
            }
          />

          {isLoading && (
            <div className="flex flex-col gap-2 items-center justify-center h-24">
              <Loader2 className="animate-spin" size={24} />
              <span>Loading users...</span>
            </div>
          )}

          {isError && <AlertError error={error} subject="Failed to retrieve users" />}

          {isSuccess &&
            (data.users.length > 0 ? (
              <ul className="divide-y max-h-[192px] overflow-y-scroll" role="list">
                {data.users.map((user) => (
                  <li key={user.id} role="listitem">
                    <UserRow user={user} onClick={impersonateUser} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-2 items-center justify-center h-24">
                <p className="text-foreground-light text-xs" role="status">
                  No users found
                </p>
              </div>
            ))}
        </div>
      ) : (
        <UserImpersonatingRow
          user={impersonatingUser}
          onClick={stopImpersonating}
          isImpersonating={true}
        />
      )}
    </div>
  )
}

export default UserImpersonationSelector

interface UserRowProps {
  user: User
  onClick: (user: User) => void
  isImpersonating?: boolean
}

const UserImpersonatingRow = ({ user, onClick, isImpersonating = false }: UserRowProps) => {
  const avatarUrl = getAvatarUrl(user)
  const displayName =
    getDisplayName(user, user.email ?? user.phone ?? user.id ?? 'Unknown') +
    (user.is_anonymous ? ' (anonymous)' : '')

  return (
    <div className="flex items-center gap-3 py-2 text-foreground">
      <div className="flex items-center gap-4 bg-surface-200 pr-5 pl-0.5 py-0.5 border rounded-full max-w-l">
        {avatarUrl ? (
          <img className="rounded-full w-5 h-5" src={avatarUrl} alt={displayName} />
        ) : (
          <div className="rounded-full w-[21px] h-[21px] bg-surface-300 border border-strong flex items-center justify-center">
            <IconUser size={12} strokeWidth={2} />
          </div>
        )}

        <span className="text-sm truncate">{displayName}</span>
      </div>

      <Button
        type="secondary"
        onClick={() => {
          onClick(user)
        }}
      >
        {isImpersonating ? 'Stop Impersonating' : 'Impersonate'}
      </Button>
    </div>
  )
}

interface UserRowProps {
  user: User
  onClick: (user: User) => void
  isImpersonating?: boolean
}

const UserRow = ({ user, onClick, isImpersonating = false }: UserRowProps) => {
  const avatarUrl = getAvatarUrl(user)
  const displayName =
    getDisplayName(user, user.email ?? user.phone ?? user.id ?? 'Unknown') +
    (user.is_anonymous ? ' (anonymous)' : '')

  return (
    <div className="flex items-center justify-between py-2 text-foreground">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img className="rounded-full w-5 h-5" src={avatarUrl} alt={displayName} />
        ) : (
          <div className="rounded-full w-[21px] h-[21px] bg-surface-300 border text-muted flex items-center justify-center text-background">
            <IconUser size={12} strokeWidth={2} />
          </div>
        )}

        <span className="text-sm">{displayName}</span>
      </div>

      <Button
        type="secondary"
        onClick={() => {
          onClick(user)
        }}
      >
        {isImpersonating ? 'Stop Impersonating' : 'Impersonate'}
      </Button>
    </div>
  )
}
