import { ChevronDown } from 'lucide-react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

import { ROWS_PER_PAGE_OPTIONS } from '@/components/interfaces/SQLEditor/SQLEditor.constants'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'

interface SqlEditorLimitSelectorProps {
  variant?: 'regular' | 'connected-on-right' | 'connected-on-both'
}

export function SqlEditorLimitSelector({ variant = 'regular' }: SqlEditorLimitSelectorProps) {
  const sessionSnap = useSqlEditorSessionSnapshot()
  const selectedLabel =
    ROWS_PER_PAGE_OPTIONS.find((opt) => opt.value === sessionSnap.limit)?.label ?? '100 rows'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="tiny"
          variant="default"
          className={cn(
            'h-[26px] justify-start gap-0 pr-3',
            variant === 'connected-on-right' && 'rounded-r-none border-r-0',
            variant === 'connected-on-both' && 'rounded-none border-x-0'
          )}
        >
          <div className="flex items-center gap-1">
            <span className="text-foreground-muted">Limit</span>
            <span>{selectedLabel}</span>
            <ChevronDown className="text-muted" strokeWidth={1} size={12} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
