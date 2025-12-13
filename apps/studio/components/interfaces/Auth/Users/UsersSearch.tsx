import { Search, X } from 'lucide-react'
import { SetStateAction } from 'react'

import { SpecificFilterColumn } from './Users.constants'

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

interface UsersSearchProps {
  search: string
  searchInvalid: boolean
  specificFilterColumn: SpecificFilterColumn
  setSearch: (value: SetStateAction<string>) => void
  setFilterKeywords: (value: string) => void
  setSpecificFilterColumn: (value: SpecificFilterColumn) => void
  improvedSearchEnabled?: boolean
}

export const UsersSearch = ({
  search,
  searchInvalid,
  specificFilterColumn,
  setSearch,
  setFilterKeywords,
  setSpecificFilterColumn,
  improvedSearchEnabled = false,
}: UsersSearchProps) => {
  return (
    <div className="flex items-center">
      <div className="text-xs h-[26px] flex items-center px-1.5 border border-strong rounded-l-md bg-surface-300">
        <Search size={14} />
      </div>

      <Select_Shadcn_
        value={specificFilterColumn}
        onValueChange={(v) => setSpecificFilterColumn(v as typeof specificFilterColumn)}
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
        onChange={(e) => {
          const value = e.target.value.replace(/\s+/g, '').toLowerCase()
          setSearch(value)
        }}
        onKeyDown={(e) => {
          if (e.code === 'Enter' || e.code === 'NumpadEnter') {
            if (!searchInvalid) setFilterKeywords(search.trim().toLocaleLowerCase())
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
