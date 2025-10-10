import { X } from 'lucide-react'
import { SetStateAction } from 'react'
import {
  Button,
  cn,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

interface PerformanceSearchProps {
  search: string
  searchInvalid: boolean
  specificFilterColumn: 'id' | 'email' | 'phone'
  setSearch: (value: SetStateAction<string>) => void
  setFilterKeywords: (value: SetStateAction<string>) => void
  setSpecificFilterColumn: (value: 'id' | 'email' | 'phone') => void
}

export const PerformanceSearch = ({
  search,
  searchInvalid,
  specificFilterColumn,
  setSearch,
  setFilterKeywords,
  setSpecificFilterColumn,
}: PerformanceSearchProps) => {
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
          className={cn('w-[125px] !bg-transparent rounded-none -ml-[1px]')}
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
          </SelectGroup_Shadcn_>
        </SelectContent_Shadcn_>
      </Select_Shadcn_>

      <Input
        size="tiny"
        className={cn(
          'w-52 bg-transparent rounded-l-none -ml-[1px]',
          searchInvalid ? 'text-red-900 dark:border-red-900' : ''
        )}
        placeholder={`Search by ${specificFilterColumn === 'id' ? 'User ID' : specificFilterColumn === 'email' ? 'Email' : 'Phone'} or prefix`}
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
              icon={<X className={cn(searchInvalid ? 'text-red-900' : '')} />}
              onClick={() => {
                setSearch('')
                setFilterKeywords('')
              }}
              className="p-0 h-5 w-5"
            />
          ) : null
        }
      />
    </div>
  )
}
