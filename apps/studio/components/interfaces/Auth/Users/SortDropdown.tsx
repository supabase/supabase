import { ArrowDownNarrowWide, ArrowDownWideNarrow } from 'lucide-react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'

interface SortDropdownProps {
  mode: 'performance' | 'freeform'
  specificFilterColumn: string
  sortColumn: string
  sortOrder: string
  sortByValue: string
  showSortByEmail: boolean
  showSortByPhone: boolean
  setSortByValue: (value: string) => void
}

export const SortDropdown = ({
  mode,
  specificFilterColumn,
  sortColumn,
  sortOrder,
  sortByValue,
  showSortByEmail,
  showSortByPhone,
  setSortByValue,
}: SortDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={mode === 'performance'}>
        <Button
          icon={
            mode === 'performance' ? (
              <ArrowDownNarrowWide />
            ) : sortOrder === 'desc' ? (
              <ArrowDownWideNarrow />
            ) : (
              <ArrowDownNarrowWide />
            )
          }
        >
          Sorted by{' '}
          {mode === 'performance'
            ? specificFilterColumn === 'id'
              ? 'user ID'
              : specificFilterColumn
            : sortColumn === 'id'
              ? 'user ID'
              : sortColumn.replaceAll('_', ' ')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44" align="start">
        <DropdownMenuRadioGroup value={sortByValue} onValueChange={setSortByValue}>
          <DropdownMenuSub>
            <DropdownMenuRadioItem value="id:asc">User ID</DropdownMenuRadioItem>
            <DropdownMenuSubTrigger>Sort by created at</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioItem value="created_at:asc">Ascending</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="created_at:desc">Descending</DropdownMenuRadioItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Sort by last sign in at</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioItem value="last_sign_in_at:asc">Ascending</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="last_sign_in_at:desc">Descending</DropdownMenuRadioItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {showSortByEmail && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Sort by email</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioItem value="email:asc">Ascending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="email:desc">Descending</DropdownMenuRadioItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {showSortByPhone && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Sort by phone</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioItem value="phone:asc">Ascending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="phone:desc">Descending</DropdownMenuRadioItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
