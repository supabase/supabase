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
} from 'ui'
import { getDisplayName } from '../Auth/Users/UserListItem.utils'

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

  const [selectedOption, setSelectedOption] = useState<string | undefined>(state.role?.role)

  return (
    <div>
      <h2>Database connection settings</h2>

      <form>
        <label>
          <input
            type="radio"
            name="role"
            value="postgres"
            checked={selectedOption === 'postgres'}
            onChange={(e) => {
              setSelectedOption(e.target.value)
            }}
            className=""
          />
          <span>postgres role</span>
        </label>

        <label>
          <input
            type="radio"
            name="role"
            value="anon"
            checked={selectedOption === 'option2'}
            onChange={(e) => {
              setSelectedOption(e.target.value)
            }}
            className=""
          />
          <span>anon role</span>
        </label>

        <label>
          <input
            type="radio"
            name="role"
            value="authenticated"
            checked={selectedOption === 'option3'}
            onChange={(e) => {
              setSelectedOption(e.target.value)
            }}
            className=""
          />
          <span>authenticated role</span>
        </label>
      </form>
    </div>
  )
}

export default RoleImpersonationSelector
