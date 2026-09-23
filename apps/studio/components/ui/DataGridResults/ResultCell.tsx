import { Expand } from 'lucide-react'
import { Button, FloatingPlate, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { formatCellValue, isLargeValue } from './DataGridResults.utils'
import { NullValue } from '@/components/grid/components/common/NullValue'

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
      className="group/cell relative flex h-full w-full items-center overflow-hidden text-ellipsis text-grid text-foreground"
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(e, column, value)
      }}
    >
      {value === null ? <NullValue /> : formatCellValue(value)}
      {showExpand && (
        <Tooltip>
          <FloatingPlate className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 focus-within:opacity-100">
            <TooltipTrigger asChild>
              <Button
                size="tiny"
                className="px-1"
                icon={<Expand size={10} />}
                aria-label="View full cell content"
                onClick={(e) => {
                  e.stopPropagation()
                  onExpand(column, value)
                }}
              />
            </TooltipTrigger>
          </FloatingPlate>
          <TooltipContent side="left">View full cell content</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
