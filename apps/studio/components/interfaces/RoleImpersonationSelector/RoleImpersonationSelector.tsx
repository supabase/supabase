import { useDebounce } from '@uidotdev/usehooks'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useUsersQuery } from 'data/auth/users-query'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
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
  cn,
} from 'ui'
import { getDisplayName } from '../Auth/Users/UserListItem.utils'
import RoleImpersonationRadio from './RoleImpersonationRadio'

export interface RoleImpersonationSelectorProps {}

const RoleImpersonationSelector = ({}: RoleImpersonationSelectorProps) => {
  const state = useRoleImpersonationStateSnapshot()

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

  const [selectedOption, setSelectedOption] = useState<string | undefined>(() => {
    if (
      state.role?.type === 'postgrest' &&
      (state.role.role === 'anon' || state.role.role === 'authenticated')
    ) {
      return state.role.role
    }

    return 'postgres'
  })

  return (
    <div className="flex flex-col gap-5 bg-background p-5">
      <h2 className="text-foreground">Database connection settings</h2>

      <form
        className="flex gap-4"
        onSubmit={(e) => {
          // don't allow form submission
          e.preventDefault()
        }}
      >
        <RoleImpersonationRadio
          value="postgres"
          isSelected={selectedOption === 'postgres'}
          onSelectedChange={setSelectedOption}
          icon={
            <svg width="53" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity={selectedOption === 'postgres' ? '1' : '.5'}>
                <rect x="37.161" y=".5" width="15" height="15" rx="5.5" stroke="#EDEDED" />
                <path
                  d="M1 10.5h32.214"
                  stroke="#33A7E9"
                  stroke-linecap="round"
                  stroke-dasharray="2 2"
                />
                <rect x="15.964" y=".5" width="9" height="15" rx="4.5" stroke="#7E7E7E" />
                <path
                  d="M1 5.5h32.214"
                  stroke="#33A7E9"
                  stroke-linecap="round"
                  stroke-dasharray="2 2"
                />
              </g>
            </svg>
          }
        />

        <RoleImpersonationRadio
          value="anon"
          isSelected={selectedOption === 'anon'}
          onSelectedChange={setSelectedOption}
          icon={
            <svg width="53" height="17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity={selectedOption === 'anon' ? '1' : '.5'}>
                <path
                  d="M1 5a.5.5 0 0 0 0 1V5Zm16.218 1h.5V5h-.5v1ZM1 6h1.014V5H1v1Zm3.04 0h2.028V5H4.041v1Zm4.056 0h2.027V5H8.096v1Zm4.054 0h2.027V5H12.15v1Zm4.055 0h1.013V5h-1.013v1Z"
                  fill="#7E7E7E"
                />
                <path d="m15.92 12.566 9.04-9.04" stroke="#EDEDED" />
                <rect x="15.964" y=".5" width="9" height="15" rx="4.5" stroke="#EDEDED" />
                <rect x="37.161" y=".75" width="15" height="15" rx="5.5" stroke="#EDEDED" />
                <path
                  d="M1 10.5h32.214"
                  stroke="#33A7E9"
                  stroke-linecap="round"
                  stroke-dasharray="2 2"
                />
                <path d="M15.96 7.566 22.568.96M19.049 14.89l5.957-5.957" stroke="#EDEDED" />
              </g>
            </svg>
          }
        />

        <RoleImpersonationRadio
          value="authenticated"
          isSelected={selectedOption === 'authenticated'}
          onSelectedChange={setSelectedOption}
        />
      </form>

      <div className="text-foreground-light text-sm">
        {selectedOption === 'postgres' && (
          <p>
            The default Postgres role. This has admin privileges.
            <br />
            It will bypass Row Level Security (RLS) policies.
          </p>
        )}

        {selectedOption === 'anon' && (
          <p>
            For "anonymous access". This is the role which the API (PostgREST) will use when a user
            <br />
            is not logged in. It will respect Row Level Security (RLS) policies.
          </p>
        )}
      </div>
    </div>
  )
}

export default RoleImpersonationSelector
