import { AuthUsersSearchSubmittedEvent } from 'common/telemetry-constants'
import { Search, X } from 'lucide-react'
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { Dispatch, forwardRef, SetStateAction } from 'react'
import {
  Button,
  cn,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
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
import { onSearchInputEscape } from '@/lib/keyboard'

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
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  improvedSearchEnabled?: boolean
  telemetryProps: Omit<AuthUsersSearchSubmittedEvent['properties'], 'trigger'>
  telemetryGroups: AuthUsersSearchSubmittedEvent['groups']
  onSelectFilterColumn: (value: SpecificFilterColumn) => void
}

export const UsersSearch = forwardRef<HTMLInputElement, UsersSearchProps>(function UsersSearch(
  {
    search,
    setSearch,
    improvedSearchEnabled = false,
    telemetryProps,
    telemetryGroups,
    onSelectFilterColumn,
  },
  ref
) {
  const [, setSelectedId] = useQueryState(
    'show',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )
  const [, setFilterKeywords] = useQueryState('keywords', { defaultValue: '' })
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

      <Select
        value={specificFilterColumn}
        onValueChange={(v) => onSelectFilterColumn(v as typeof specificFilterColumn)}
      >
        <SelectTrigger
          size="tiny"
          className={cn(
            'w-[130px] bg-transparent! rounded-none -ml-px',
            specificFilterColumn === 'freeform' && 'text-warning'
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="id" className="text-xs">
              User ID
            </SelectItem>
            <SelectItem value="email" className="text-xs">
              Email address
            </SelectItem>
            {improvedSearchEnabled && (
              <SelectItem value="name" className="text-xs">
                Name
              </SelectItem>
            )}
            <SelectItem value="phone" className="text-xs">
              Phone number
            </SelectItem>
            {!improvedSearchEnabled && (
              <>
                <SelectSeparator />
                <Tooltip>
                  <TooltipTrigger>
                    <SelectItem value="freeform" className="text-xs">
                      Unified search
                    </SelectItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="w-64 text-center">
                    Search by all columns at once, including mid-string search. May impact database
                    performance if you have many users.
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Input
        ref={ref}
        size="tiny"
        containerClassName="w-[245px] rounded-l-none -ml-px"
        className={cn(
          'bg-transparent',
          searchInvalid ? 'text-red-900 dark:border-red-900' : '',
          search.length > 1 && 'pr-6'
        )}
        placeholder={getSearchPlaceholder(specificFilterColumn)}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.code === 'Enter' || e.code === 'NumpadEnter') {
            if (!searchInvalid) onSubmitSearch()
            return
          }
          onSearchInputEscape(search, () => {
            setSearch('')
            setFilterKeywords('')
          })(e)
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
})
