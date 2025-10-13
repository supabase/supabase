import { ButtonTooltip } from 'components/ui/ButtonTooltip'
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
  if (mode === 'performance') {
    return (
      <ButtonTooltip
        disabled
        type="default"
        icon={<ArrowDownNarrowWide />}
        tooltip={{
          content: { side: 'bottom', text: 'Sort cannot be changed in optimized search mode' },
        }}
      >
        Sorted by User ID
      </ButtonTooltip>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button icon={sortOrder === 'desc' ? <ArrowDownWideNarrow /> : <ArrowDownNarrowWide />}>
          Sorted by {sortColumn.replaceAll('_', ' ')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44" align="start">
        <DropdownMenuRadioGroup value={sortByValue} onValueChange={setSortByValue}>
          <DropdownMenuSub>
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
