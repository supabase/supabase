import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { User, useUsersInfiniteQuery } from '@/data/auth/users-infinite-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'
import { ResponseError } from '@/types'

export const UserSelector = () => {
  const { data: project } = useSelectedProjectQuery()
  const state = useRoleImpersonationStateSnapshot()

  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const debouncedSearchText = useDebounce(searchText, 300)

  const { data, error, isSuccess, isPending, isError } = useUsersInfiniteQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      keywords: debouncedSearchText.trim().toLocaleLowerCase(),
    },
    { placeholderData: keepPreviousData }
  )
  const users = useMemo(() => data?.pages.flatMap((page) => page.result) ?? [], [data?.pages])

  const impersonatingUser =
    state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'native'
      ? state.role.user
      : undefined

  const onSelectUser = async (user: User) => {
    try {
      await state.setRole({
        type: 'postgrest',
        role: 'authenticated',
        userType: 'native',
        user,
        aal: 'aal1',
      })
    } catch (error) {
      toast.error(`Failed to impersonate user: ${(error as ResponseError).message}`)
    }
  }

  return (
    <FormItemLayout isReactForm={false} label="Select which user to test as">
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            block
            type="default"
            role="combobox"
            size="small"
            aria-expanded={open}
            className={cn('justify-between', !impersonatingUser && 'text-foreground-lighter')}
            iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          >
            {impersonatingUser?.email ?? 'Select a user'}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ sameWidthAsTrigger className="p-0" side="bottom" align="start">
          <Command_Shadcn_ shouldFilter={false}>
            <CommandInput_Shadcn_
              showResetIcon
              placeholder="Search for a user"
              className="text-xs"
              value={searchText}
              onValueChange={setSearchText}
            />

            {isError ? (
              <Admonition showIcon={false} type="warning" className="border-0 rounded-none text-xs">
                Failed to fetch users: {error.message}
              </Admonition>
            ) : (
              <CommandEmpty_Shadcn_>No user found</CommandEmpty_Shadcn_>
            )}

            <CommandList_Shadcn_>
              {isPending && (
                <div className="p-2">
                  <GenericSkeletonLoader />
                </div>
              )}

              {isSuccess && (
                <CommandGroup_Shadcn_>
                  <ScrollArea className={users.length > 7 ? 'h-full md:h-[210px]' : ''}>
                    {users.map((user) => {
                      return (
                        <CommandItem_Shadcn_
                          key={user.id}
                          value={user.email}
                          className="cursor-pointer w-full"
                          onSelect={() => {
                            onSelectUser(user)
                            setOpen(false)
                          }}
                        >
                          <div className="w-full flex items-center justify-between">
                            <p className="space-x-3">
                              <span className="text-foreground-light">{user.email}</span>
                              <code className="text-code-inline text-foreground-lighter!">
                                {user.id?.slice(0, 8)}
                              </code>
                            </p>
                            {impersonatingUser?.id === user.id && <Check size={16} />}
                          </div>
                        </CommandItem_Shadcn_>
                      )
                    })}
                  </ScrollArea>
                </CommandGroup_Shadcn_>
              )}
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </FormItemLayout>
  )
}
