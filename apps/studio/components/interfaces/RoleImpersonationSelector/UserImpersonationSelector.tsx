import { useDebounce } from '@uidotdev/usehooks'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { User, useUsersQuery } from 'data/auth/users-query'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { Button, IconLoader, IconSearch, IconUser, IconX, Input } from 'ui'
import { getAvatarUrl, getDisplayName } from '../Auth/Users/UserListItem.utils'

export interface UserImpersonationSelectorProps {
  onStopImpersonatingUser?: () => void
}

const UserImpersonationSelector = ({ onStopImpersonatingUser }: UserImpersonationSelectorProps) => {
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText, 300)

  const { project } = useProjectContext()
  const { data, isSuccess, isLoading, isError, error, isFetching, isPreviousData } = useUsersQuery(
    {
      projectRef: project?.ref,
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

    onStopImpersonatingUser?.()
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
      <p>
        {!impersonatingUser ? (
          <>
            Select a user or use a JWT token to respect your database's Row-Level Security
            <br />
            policies for that particular user.
          </>
        ) : (
          "Results will respect your database's Row-Level Security policies for this user."
        )}
      </p>

      {!impersonatingUser ? (
        <div className="flex flex-col gap-2 mt-4">
          <Input
            className="table-editor-search border-none"
            icon={
              isSearching ? (
                <IconLoader
                  className="animate-spin text-foreground-lighter"
                  size={16}
                  strokeWidth={1.5}
                />
              ) : (
                <IconSearch className="text-foreground-lighter" size={16} strokeWidth={1.5} />
              )
            }
            placeholder="Search users"
            onChange={(e) => setSearchText(e.target.value.trim())}
            value={searchText}
            size="small"
            actions={
              searchText && (
                <Button size="tiny" type="text" onClick={() => setSearchText('')}>
                  <IconX size={12} strokeWidth={2} />
                </Button>
              )
            }
          />

          {isLoading && (
            <div className="flex flex-col gap-2 items-center justify-center h-24">
              <IconLoader className="animate-spin" size={24} />
              <span>Loading users...</span>
            </div>
          )}

          {isError && <AlertError error={error} subject="Failed to retrieve users" />}

          {isSuccess &&
            (data.users.length > 0 ? (
              <ul className="divide-y">
                {data.users.map((user) => (
                  <li key={user.id}>
                    <UserRow user={user} onClick={impersonateUser} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-2 items-center justify-center h-24">
                <p className="text-foreground-light">No users found</p>
              </div>
            ))}
        </div>
      ) : (
        <UserRow user={impersonatingUser} onClick={stopImpersonating} isImpersonating={true} />
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

const UserRow = ({ user, onClick, isImpersonating = false }: UserRowProps) => {
  const avatarUrl = getAvatarUrl(user)
  const displayName = getDisplayName(user, user.email ?? user.phone ?? user.id ?? 'Unknown')

  return (
    <div className="flex items-center justify-between py-2 text-foreground">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img className="rounded-full w-8 h-8" src={avatarUrl} alt={displayName} />
        ) : (
          <div className="rounded-full w-8 h-8 bg-foreground-lighter flex items-center justify-center text-background">
            <IconUser size={16} strokeWidth={2} />
          </div>
        )}

        <span>{displayName}</span>
      </div>

      <div>
        <Button
          type="secondary"
          onClick={() => {
            onClick(user)
          }}
        >
          {isImpersonating ? 'Stop Impersonating' : 'Impersonate'}
        </Button>
      </div>
    </div>
  )
}
