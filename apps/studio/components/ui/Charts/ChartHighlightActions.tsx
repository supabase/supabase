import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { ArrowRight, SearchIcon } from 'lucide-react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { ChartHighlight } from './useChartHighlight'
import { UpdateDateRange } from 'pages/project/[ref]/reports/database'

const ChartHighlightActions = ({
  chartHighlight,
  updateDateRange,
}: {
  chartHighlight?: ChartHighlight
  updateDateRange: UpdateDateRange
}) => {
  const { left: selectedRangeStart, right: selectedRangeEnd, clearHighlight } = chartHighlight ?? {}
  const [isOpen, setIsOpen] = useState(!!chartHighlight?.popoverPosition)

  useEffect(() => {
    setIsOpen(!!chartHighlight?.popoverPosition && selectedRangeStart !== selectedRangeEnd)
  }, [chartHighlight?.popoverPosition])

  const disableZoomIn = dayjs(selectedRangeEnd).diff(dayjs(selectedRangeStart), 'minutes') < 10
  const handleZoomIn = () => {
    if (disableZoomIn) return
    updateDateRange(selectedRangeStart!, selectedRangeEnd!)
    clearHighlight && clearHighlight()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        className="w-auto p-0"
        style={{
          position: 'absolute',
          left: chartHighlight?.popoverPosition?.x + 'px' || 0,
          top: chartHighlight?.popoverPosition?.y + 'px' || 0,
        }}
      />
      <DropdownMenuContent className="flex flex-col gap-1 p-1 w-fit text-left">
        <DropdownMenuLabel className="flex items-center justify-center text-foreground-lighter font-mono gap-1 text-xs">
          <span>{dayjs(selectedRangeStart).format('MMM D, H:mm')}</span>
          <ArrowRight size={10} />
          <span>{dayjs(selectedRangeEnd).format('MMM D, H:mm')}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem
          disabled={disableZoomIn}
          className={cn('group', disableZoomIn && '!bg-transparent')}
        >
          <button
            disabled={disableZoomIn}
            onClick={handleZoomIn}
            className="w-full flex items-center gap-1.5"
          >
            <SearchIcon className="text-foreground-lighter" size={12} />
            <span className="flex-grow text-left text-foreground-light">Zoom in</span>
            {disableZoomIn && (
              <span className="text-foreground-muted text-xs">10 minutes min.</span>
            )}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ChartHighlightActions
