import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRight, LogsIcon, SearchIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { ChartHighlight } from './useChartHighlight'

const ChartHighlightActions = ({ chartHighlight }: { chartHighlight?: ChartHighlight }) => {
  const { ref } = useParams()
  const { left: selectedRangeStart, right: selectedRangeEnd, isSelecting } = chartHighlight ?? {}
  const [isOpen, setIsOpen] = useState(!!chartHighlight?.popoverPosition)

  useEffect(() => {
    setIsOpen(!!chartHighlight?.popoverPosition)
  }, [chartHighlight?.popoverPosition])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        className="w-auto p-0"
        style={{
          position: 'absolute',
          left: chartHighlight?.popoverPosition?.x + 'px' ?? 0,
          top: chartHighlight?.popoverPosition?.y + 'px' ?? 0,
        }}
      />
      <DropdownMenuContent className="flex flex-col gap-1 p-1 w-fit">
        <DropdownMenuLabel className="flex items-center gap-1">
          <span>{dayjs(selectedRangeStart).format('MMM D, H:mm')}</span>
          <ArrowRight size={10} />
          <span>{dayjs(selectedRangeEnd).format('MMM D, H:mm')}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link
            className="flex items-center gap-1.5"
            href={`/project/${ref}/logs/postgres-logs?iso_timestamp_start=${selectedRangeStart}&iso_timestamp_end=${selectedRangeEnd}`}
          >
            <LogsIcon className="text-foreground-lighter" size={12} />
            <span>Open in Logs Explorer</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <button className="flex items-center gap-1.5" onClick={() => alert('Zoommed in!')}>
            <SearchIcon className="text-foreground-lighter" size={12} />
            <span>Zoom in</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ChartHighlightActions
