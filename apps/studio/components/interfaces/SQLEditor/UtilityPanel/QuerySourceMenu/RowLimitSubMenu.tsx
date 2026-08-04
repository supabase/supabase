import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'ui'

import { ROWS_PER_PAGE_OPTIONS } from '../../SQLEditor.constants'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'

export const RowLimitSubMenu = () => {
  const sessionSnap = useSqlEditorSessionSnapshot()
  const currentLabel = ROWS_PER_PAGE_OPTIONS.find((opt) => opt.value === sessionSnap.limit)?.label

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <div className="flex flex-col">
          <span>Row limit</span>
          <span className="text-foreground-lighter text-xs">{currentLabel}</span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-40">
        <DropdownMenuRadioGroup
          value={sessionSnap.limit.toString()}
          onValueChange={(val) => sessionSnap.setLimit(Number(val))}
        >
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
