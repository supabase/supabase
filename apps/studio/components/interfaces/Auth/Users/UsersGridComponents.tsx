import { ChevronDown, SortAsc, SortDesc } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useHeaderRowSelection } from 'react-data-grid'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

// [Joshen] Currently not being used, refer to Users.utils -> formatUserColumns for more info
export const SelectHeaderCell = ({
  selectedUsers,
  allRowsSelected,
}: {
  selectedUsers: Set<any>
  allRowsSelected: boolean
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { isRowSelected, onRowSelectionChange } = useHeaderRowSelection()

  const isIndeterminate = selectedUsers.size > 0 && !allRowsSelected

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = isIndeterminate
  }, [isIndeterminate])

  return (
    <div className="px-4 flex items-center sb-grid">
      <div className="sb-grid-select-cell__header">
        <input
          ref={inputRef}
          type="checkbox"
          aria-label="Select-all"
          className="sb-grid-select-cell__header__input"
          disabled={false}
          checked={isRowSelected}
          onChange={(e) => onRowSelectionChange({ checked: e.target.checked })}
        />
      </div>
    </div>
  )
}

export const HeaderCell = ({
  col,
  specificFilterColumn,
  setSortByValue,
}: {
  col: any
  specificFilterColumn: string
  setSortByValue: (value: string) => void
}) => {
  const ref = useRef<number>(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    ref.current = Number(new Date())
  }, [open])

  return (
    <div className="flex items-center justify-between font-normal text-xs w-full">
      <div className="flex items-center gap-x-2">
        <p className="!text-foreground">{col.name}</p>
      </div>
      {specificFilterColumn === 'freeform' && ['created_at', 'email', 'phone'].includes(col.id) && (
        <DropdownMenu
          open={open}
          onOpenChange={(val) => {
            // [Joshen] This is a temp hack between the DropdownMenu and react data grid
            // as the header cell is selectable, which takes the focus away from the dropdown menu
            // causing it to close immediately.
            if (val === false && Number(new Date()) - ref.current > 100) setOpen(val)
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              type="text"
              icon={<ChevronDown />}
              className="p-0 h-5 w-5"
              onClick={() => setOpen(!open)}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-36">
            <DropdownMenuItem
              className="flex items-center gap-x-2"
              onClick={() => {
                setOpen(false)
                setSortByValue(`${col.id}:desc`)
              }}
            >
              <SortDesc size={14} />
              Sort descending
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-x-2"
              onClick={() => {
                setOpen(false)
                setSortByValue(`${col.id}:asc`)
              }}
            >
              <SortAsc size={14} />
              Sort ascending
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
