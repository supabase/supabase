import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { ChevronDown, User as IconUser, Loader2, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import { getAvatarUrl, getDisplayName } from '@/components/interfaces/Auth/Users/Users.utils'
import { AlertError } from '@/components/ui/AlertError'
import { useUserQuery } from '@/data/auth/user-query'
import { User, useUsersInfiniteQuery } from '@/data/auth/users-infinite-query'

interface UserActivitySelectorProps {
  projectRef: string | undefined
  connectionString: string | null | undefined
  value: string | null
  onChange: (userId: string | null) => void
}

export const UserActivitySelector = ({
  projectRef,
  connectionString,
  value,
  onChange,
}: UserActivitySelectorProps) => {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText, 300)

  // The last user picked from the list, kept locally so the trigger can show a display
  // name/avatar immediately without waiting on a lookup.
  const [resolvedUser, setResolvedUser] = useState<User | null>(null)

  // On a fresh page load with only `?user=<id>` in the URL (no picked-user cache yet),
  // look the user up by id so the trigger can show their name instead of the raw id.
  const isResolved = resolvedUser?.id === value
  const { data: fetchedUser, isLoading: isLoadingUser } = useUserQuery(
    { projectRef, connectionString, userId: value },
    { enabled: !!value && !isResolved }
  )
  const displayUser = isResolved ? resolvedUser : (fetchedUser ?? null)
  const isResolvingUser = !!value && !displayUser && isLoadingUser

  const {
    data,
    isSuccess,
    isPending: isLoading,
    isError,
    error,
    isFetching,
    isPlaceholderData,
  } = useUsersInfiniteQuery(
    { projectRef, connectionString, keywords: debouncedSearchText.trim().toLowerCase() },
    { placeholderData: keepPreviousData, enabled: open }
  )
  const users = useMemo(() => data?.pages.flatMap((page) => page.result) ?? [], [data?.pages])
  const isSearching = isPlaceholderData && isFetching

  const handleSelect = (user: User) => {
    if (!user.id) return
    setResolvedUser(user)
    onChange(user.id)
    setOpen(false)
    setSearchText('')
  }

  const displayName = displayUser
    ? getDisplayName(displayUser, displayUser.email ?? displayUser.phone ?? displayUser.id ?? '')
    : null

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="tiny"
          className="h-7 justify-start"
          iconRight={<ChevronDown className="text-foreground-muted" size={14} strokeWidth={1.5} />}
        >
          {isResolvingUser ? (
            <span className="flex items-center gap-x-2">
              <Loader2 className="animate-spin text-foreground-lighter" size={14} />
              <span className="text-xs text-foreground-light">Loading user...</span>
            </span>
          ) : value ? (
            <span className="flex items-center gap-x-2">
              <UserAvatar user={displayUser} />
              <span className="text-xs text-foreground">{displayName ?? value}</span>
            </span>
          ) : (
            'Select a user'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80" align="start">
        <div className="p-3 flex flex-col gap-y-2">
          <InputGroup>
            <InputGroupInput
              size="tiny"
              className="pr-10 border-none"
              placeholder="Search by id, email, phone, or name..."
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              autoFocus
            />
            <InputGroupAddon>
              {isSearching ? (
                <Loader2
                  className="animate-spin text-foreground-lighter"
                  size={16}
                  strokeWidth={1.5}
                />
              ) : (
                <Search className="text-foreground-lighter" size={16} strokeWidth={1.5} />
              )}
            </InputGroupAddon>
            {searchText && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="tiny" variant="text" onClick={() => setSearchText('')}>
                  <span className="sr-only">Clear search</span>
                  <X size={12} />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          {isLoading && (
            <div className="flex flex-col gap-2 items-center justify-center h-24">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-foreground-light text-sm">Loading users...</span>
            </div>
          )}

          {isError && <AlertError error={error} subject="Failed to retrieve users" />}

          {isSuccess &&
            (users.length > 0 ? (
              <ul className="divide-y max-h-[240px] overflow-y-auto -mx-3">
                {users.map((user) => (
                  <li key={user.id}>
                    <UserActivitySelectorRow user={user} onClick={handleSelect} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-16">
                <p className="text-foreground-light text-xs" role="status">
                  No users found
                </p>
              </div>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const UserAvatar = ({ user }: { user: User | null }) => {
  const avatarUrl = user ? getAvatarUrl(user) : undefined
  if (avatarUrl) {
    return <img className="rounded-full w-5 h-5" src={avatarUrl} alt="" />
  }
  return (
    <div className="rounded-full w-[21px] h-[21px] bg-surface-300 border flex items-center justify-center text-foreground-lighter">
      <IconUser size={12} strokeWidth={2} />
    </div>
  )
}

const UserActivitySelectorRow = ({
  user,
  onClick,
}: {
  user: User
  onClick: (user: User) => void
}) => {
  const emailOrPhone = user.email || user.phone
  const displayName = getDisplayName(user, '')
  const showDisplayName = displayName && displayName !== emailOrPhone

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={() => onClick(user)}
      className="w-full flex items-center gap-x-3 px-3 py-2 text-left hover:bg-surface-200"
    >
      <UserAvatar user={user} />
      <span className="text-sm flex flex-col">
        <span className="text-foreground">{emailOrPhone}</span>
        {showDisplayName && <span className="text-foreground-lighter text-xs">{displayName}</span>}
      </span>
    </button>
  )
}
