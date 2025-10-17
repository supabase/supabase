import { X } from 'lucide-react'
import { SetStateAction } from 'react'

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
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

interface UsersSearchProps {
  search: string
  searchInvalid: boolean
  specificFilterColumn: 'id' | 'email' | 'phone' | 'freeform'
  setSearch: (value: SetStateAction<string>) => void
  setFilterKeywords: (value: string) => void
  setSpecificFilterColumn: (value: 'id' | 'email' | 'phone' | 'freeform') => void
}

export const UsersSearch = ({
  search,
  searchInvalid,
  specificFilterColumn,
  setSearch,
  setFilterKeywords,
  setSpecificFilterColumn,
}: UsersSearchProps) => {
  return (
    <div className="flex items-center">
      <div className="text-xs h-[26px] flex items-center px-2 border border-strong rounded-l-md bg-surface-300">
        Search
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
            <SelectItem_Shadcn_ value="phone" className="text-xs">
              Phone number
            </SelectItem_Shadcn_>
            <SelectSeparator_Shadcn_ />
            <SelectItem_Shadcn_ value="freeform" className="text-xs">
              All columns
            </SelectItem_Shadcn_>
          </SelectGroup_Shadcn_>
        </SelectContent_Shadcn_>
      </Select_Shadcn_>

      <Input
        size="tiny"
        className={cn(
          'w-64 bg-transparent rounded-l-none -ml-[1px]',
          searchInvalid ? 'text-red-900 dark:border-red-900' : '',
          search.length > 1 && 'pr-6'
        )}
        placeholder={
          specificFilterColumn === 'freeform'
            ? 'Search by user ID, email, phone or name'
            : `Search by ${specificFilterColumn === 'id' ? 'User ID' : specificFilterColumn === 'email' ? 'Email' : 'Phone'}`
        }
        value={search}
        onChange={(e) => {
          const value = e.target.value.replace(/\s+/g, '').toLowerCase()
          setSearch(value)
        }}
        onKeyDown={(e) => {
          if (e.code === 'Enter' || e.code === 'NumpadEnter') {
            setSearch((s) => {
              if (s && specificFilterColumn === 'phone' && !s.startsWith('+')) {
                return `+${s}`
              } else {
                return s
              }
            })
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
