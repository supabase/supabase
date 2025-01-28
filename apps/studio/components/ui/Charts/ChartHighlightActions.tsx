import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRight, ChevronRightIcon, LogsIcon, SearchIcon } from 'lucide-react'
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
    setIsOpen(!!chartHighlight?.popoverPosition && selectedRangeStart !== selectedRangeEnd)
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
      <DropdownMenuContent className="flex flex-col gap-1 p-1 w-fit text-left">
        <DropdownMenuLabel className="flex items-center justify-center text-foreground-lighter font-mono gap-1 text-xs">
          <span>{dayjs(selectedRangeStart).format('MMM D, H:mm')}</span>
          <ArrowRight size={10} />
          <span>{dayjs(selectedRangeEnd).format('MMM D, H:mm')}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem>
          <Link
            className="w-full flex items-center gap-1.5"
            href={`/project/${ref}/logs/postgres-logs?iso_timestamp_start=${selectedRangeStart}&iso_timestamp_end=${selectedRangeEnd}`}
          >
            <LogsIcon className="text-foreground-lighter" size={12} />
            <span className="flex-grow text-left">Open in Logs Explorer</span>
            <ChevronRightIcon className="text-foreground-lighter ml-2" size={12} />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <button className="w-full flex items-center gap-1.5" onClick={() => alert('Zoommed in!')}>
            <SearchIcon className="text-foreground-lighter" size={12} />
            <span className="flex-grow text-left">Zoom in</span>
            <ChevronRightIcon className="text-foreground-lighter ml-2" size={12} />
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ChartHighlightActions
