import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'ui'

import { ROWS_PER_PAGE_OPTIONS } from '../../SQLEditor.constants'

interface RowLimitSubMenuProps {
  value: number
  onValueChange: (value: string) => void
}

export const RowLimitSubMenu = ({ value, onValueChange }: RowLimitSubMenuProps) => {
  const currentLabel = ROWS_PER_PAGE_OPTIONS.find((opt) => opt.value === value)?.label

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <div className="flex flex-col">
          <span>Row limit</span>
          <span className="text-foreground-lighter text-xs">{currentLabel}</span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-40">
        <DropdownMenuRadioGroup value={value.toString()} onValueChange={onValueChange}>
          {ROWS_PER_PAGE_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.label} value={option.value.toString()}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
