import { AuthUsersSearchSubmittedEvent } from 'common/telemetry-constants'
import { Search, X } from 'lucide-react'
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { useState } from 'react'
import {
  Button,
  cn,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectSeparator_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import {
  PHONE_NUMBER_LEFT_PREFIX_REGEX,
  SpecificFilterColumn,
  UUIDV4_LEFT_PREFIX_REGEX,
} from './Users.constants'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'

const getSearchPlaceholder = (column: SpecificFilterColumn): string => {
  switch (column) {
    case 'id':
      return 'Search by user ID'
    case 'email':
      return 'Search by email'
    case 'name':
      return 'Search by name'
    case 'phone':
      return 'Search by phone'
    case 'freeform':
      return 'Search by user ID, email, phone or name'
    default:
      return 'Search users...'
  }
}

interface UsersSearchProps {
  improvedSearchEnabled?: boolean
  telemetryProps: Omit<AuthUsersSearchSubmittedEvent['properties'], 'trigger'>
  telemetryGroups: AuthUsersSearchSubmittedEvent['groups']
  onSelectFilterColumn: (value: SpecificFilterColumn) => void
}

export const UsersSearch = ({
  improvedSearchEnabled = false,
  telemetryProps,
  telemetryGroups,
  onSelectFilterColumn,
}: UsersSearchProps) => {
  const [, setSelectedId] = useQueryState(
    'show',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )
  const [filterKeywords, setFilterKeywords] = useQueryState('keywords', { defaultValue: '' })
  const [specificFilterColumn] = useQueryState<SpecificFilterColumn>(
    'filter',
    parseAsStringEnum<SpecificFilterColumn>([
      'id',
      'email',
      'phone',
      'name',
      'freeform',
    ]).withDefault('email')
  )

  const [search, setSearch] = useState(filterKeywords)
  const { mutate: sendEvent } = useSendEventMutation()

  const searchInvalid =
    !search ||
    specificFilterColumn === 'freeform' ||
    specificFilterColumn === 'email' ||
    specificFilterColumn === 'name'
      ? false
      : specificFilterColumn === 'id'
        ? !search.match(UUIDV4_LEFT_PREFIX_REGEX)
        : !search.match(PHONE_NUMBER_LEFT_PREFIX_REGEX)

  const onSubmitSearch = () => {
    const s = search.trim().toLocaleLowerCase()
    setFilterKeywords(s)
    setSelectedId(null)
    sendEvent({
      action: 'auth_users_search_submitted',
      properties: {
        trigger: 'search_input',
        ...telemetryProps,
        keywords: s,
      },
      groups: telemetryGroups,
    })
  }

  return (
    <div className="flex items-center">
      <div className="text-xs h-[26px] flex items-center px-1.5 border border-strong rounded-l-md bg-surface-300">
        <Search size={14} />
      </div>

      <Select_Shadcn_
        value={specificFilterColumn}
        onValueChange={(v) => onSelectFilterColumn(v as typeof specificFilterColumn)}
      >
        <SelectTrigger_Shadcn_
          size="tiny"
          className={cn(
            'w-[130px] !bg-transparent rounded-none -ml-[1px]',
            specificFilterColumn === 'freeform' && 'text-warning'
          )}
        >
          <SelectValue_Shadcn_ />
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          <SelectGroup_Shadcn_>
            <SelectItem_Shadcn_ value="id" className="text-xs">
              User ID
            </SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="email" className="text-xs">
              Email address
            </SelectItem_Shadcn_>
            {improvedSearchEnabled && (
              <SelectItem_Shadcn_ value="name" className="text-xs">
                Name
              </SelectItem_Shadcn_>
            )}
            <SelectItem_Shadcn_ value="phone" className="text-xs">
              Phone number
            </SelectItem_Shadcn_>
            {!improvedSearchEnabled && (
              <>
                <SelectSeparator_Shadcn_ />
                <Tooltip>
                  <TooltipTrigger>
                    <SelectItem_Shadcn_ value="freeform" className="text-xs">
                      Unified search
                    </SelectItem_Shadcn_>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="w-64 text-center">
                    Search by all columns at once, including mid-string search. May impact database
                    performance if you have many users.
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </SelectGroup_Shadcn_>
        </SelectContent_Shadcn_>
      </Select_Shadcn_>

      <Input
        size="tiny"
        className={cn(
          'w-[245px] bg-transparent rounded-l-none -ml-[1px]',
          searchInvalid ? 'text-red-900 dark:border-red-900' : '',
          search.length > 1 && 'pr-6'
        )}
        placeholder={getSearchPlaceholder(specificFilterColumn)}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.code === 'Enter' || e.code === 'NumpadEnter') {
            if (!searchInvalid) onSubmitSearch()
          }
        }}
        actions={
          search ? (
            <Button
              size="tiny"
              type="text"
              className="p-0 h-5 w-5"
              icon={<X className={cn(searchInvalid ? 'text-red-900' : '')} />}
              onClick={() => {
                setSearch('')
                setFilterKeywords('')
              }}
            />
          ) : null
        }
      />
    </div>
  )
}
