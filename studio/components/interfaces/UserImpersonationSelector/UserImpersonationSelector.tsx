import { useDebounce } from '@uidotdev/usehooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useUsersQuery } from 'data/auth/users-query'
import { useState } from 'react'
import { useUserImpersonationStateSnapshot } from 'state/user-impersonation-state'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  IconCheck,
  IconUser,
  IconUserX,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'
import { getDisplayName } from '../Auth/Users/UserListItem.utils'

const UserImpersonationSelector = () => {
  const state = useUserImpersonationStateSnapshot()

  const [searchStr, setSearchStr] = useState('')
  const debouncedSearchStr = useDebounce(searchStr, 300)

  const { project } = useProjectContext()
  const { data, isSuccess, isLoading, isError, error } = useUsersQuery(
    {
      projectRef: project?.ref,
      keywords: searchStr === '' ? undefined : debouncedSearchStr || undefined,
    },
    {
      keepPreviousData: true,
    }
  )

  const [isOpen, setIsOpen] = useState(false)

  const isImpersonatingUser = state.user !== null
  const Icon = isImpersonatingUser ? IconUser : IconUserX

  return (
    <Popover_Shadcn_ open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button size="tiny" type={isImpersonatingUser ? 'warning' : 'outline'}>
          <div className="flex items-center gap-2">
            <Icon
              className={isImpersonatingUser ? 'text-amber-1100' : 'text-foreground-light'}
              strokeWidth={2}
              size={12}
            />
            {state.user
              ? `Impersonating ${getDisplayName(
                  state.user,
                  state.user.email || state.user.phone || state.user.id || 'Unknown'
                )}`
              : 'Impersonate User'}
          </div>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_
            placeholder="Find user..."
            value={searchStr}
            onValueChange={setSearchStr}
          />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>
              {isLoading && 'Loading...'}
              {isError && `Error loading users: ${error.message}`}
              {isSuccess && 'No users found'}
            </CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              {isSuccess && (
                <ScrollArea className={(data?.users || []).length > 7 ? 'h-[210px]' : ''}>
                  <CommandItem_Shadcn_
                    className="cursor-pointer flex items-center justify-between gap-2 w-full"
                    onSelect={() => {
                      state.setUser(null)
                      setIsOpen(false)
                    }}
                    onClick={() => {
                      state.setUser(null)
                      setIsOpen(false)
                    }}
                  >
                    <span>Superuser (default)</span>
                    {state.user === null && <IconCheck className="text-brand" strokeWidth={2} />}
                  </CommandItem_Shadcn_>

                  <CommandSeparator_Shadcn_ />

                  {data.users.map((user) => (
                    <CommandItem_Shadcn_
                      key={user.id}
                      className="cursor-pointer flex items-center justify-between gap-2 w-full"
                      onSelect={() => {
                        state.setUser(user)
                        setIsOpen(false)
                      }}
                      onClick={() => {
                        state.setUser(user)
                        setIsOpen(false)
                      }}
                    >
                      <span>
                        {getDisplayName(user, user.email || user.phone || user.id || 'Unknown')}
                      </span>
                      {state.user !== null && state.user.id === user.id && (
                        <IconCheck className="text-brand" strokeWidth={2} />
                      )}
                    </CommandItem_Shadcn_>
                  ))}
                </ScrollArea>
              )}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default UserImpersonationSelector
