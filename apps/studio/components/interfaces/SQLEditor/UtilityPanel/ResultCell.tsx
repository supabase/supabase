import { Expand } from 'lucide-react'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { formatCellValue, isLargeValue } from './Results.utils'

interface ResultCellProps {
  column: string
  value: unknown
  onContextMenu: (e: React.MouseEvent, column: string, value: unknown) => void
  onExpand: (column: string, value: unknown) => void
}

export const ResultCell = ({ column, value, onContextMenu, onExpand }: ResultCellProps) => {
  const showExpand = isLargeValue(value)

  return (
    <div
      className={cn(
        'group/cell relative flex items-center h-full font-mono text-xs w-full whitespace-pre',
        value === null && 'text-foreground-lighter'
      )}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(e, column, value)
      }}
    >
      {formatCellValue(value)}
      {showExpand && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="default"
              size="tiny"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-1 opacity-0 group-hover/cell:opacity-100 focus-visible:opacity-100"
              icon={<Expand size={10} />}
              aria-label="View full cell content"
              onClick={(e) => {
                e.stopPropagation()
                onExpand(column, value)
              }}
            />
          </TooltipTrigger>
          <TooltipContent side="left">View full cell content</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
