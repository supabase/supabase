import dayjs from 'dayjs'
import { ArrowRight, SearchIcon } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
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
import { useFormatDateTime } from '@/lib/datetime'

const toFormattableDate = (value: string): string | number => {
  const asNumber = Number(value)
  return value !== '' && Number.isFinite(asNumber) ? asNumber : value
}

export type UpdateDateRange = (from: string, to: string) => void

export type ChartHighlightActionContext = {
  start: string
  end: string
  clear: () => void
  chartId?: string
}

export type ChartHighlightAction = {
  id: string
  label: string | ((ctx: ChartHighlightActionContext) => string)
  icon?: ReactNode
  isDisabled?: (ctx: ChartHighlightActionContext) => boolean
  rightSlot?: ReactNode | ((ctx: ChartHighlightActionContext) => ReactNode)
  onSelect: (ctx: ChartHighlightActionContext) => void
}

export const ChartHighlightActions = ({
  chartHighlight,
  updateDateRange,
  actions,
  chartId,
}: {
  chartHighlight?: ChartHighlight
  updateDateRange?: UpdateDateRange
  actions?: ChartHighlightAction[]
  chartId?: string
}) => {
  const { left: selectedRangeStart, right: selectedRangeEnd, clearHighlight } = chartHighlight ?? {}
  const [isOpen, setIsOpen] = useState(!!chartHighlight?.popoverPosition)
  const formatChartDate = useFormatDateTime()

  useEffect(() => {
    setIsOpen(!!chartHighlight?.popoverPosition)
  }, [chartHighlight?.popoverPosition])

  const ctx: ChartHighlightActionContext | undefined =
    selectedRangeStart && selectedRangeEnd && clearHighlight
      ? { start: selectedRangeStart, end: selectedRangeEnd, clear: clearHighlight, chartId }
      : undefined

  const defaultActions: ChartHighlightAction[] = useMemo(() => {
    if (!updateDateRange || !ctx) return []
    const isDisabled = dayjs(ctx.end).diff(dayjs(ctx.start), 'minutes') < 10
    return [
      {
        id: 'zoom-in',
        label: 'Zoom in',
        icon: <SearchIcon className="text-foreground-lighter" size={12} />,
        rightSlot: isDisabled ? <span className="text-xs">Min. 10 minutes</span> : null,
        isDisabled: () => isDisabled,
        onSelect: ({ start, end, clear }) => {
          if (isDisabled) return
          updateDateRange(start, end)
          clear()
        },
      },
    ]
  }, [ctx, updateDateRange])

  const allActions: ChartHighlightAction[] = useMemo(() => {
    const provided = actions ?? []
    return [...defaultActions, ...provided]
  }, [defaultActions, actions])

  const positionKey = chartHighlight?.popoverPosition
    ? `${chartHighlight.popoverPosition.x}-${chartHighlight.popoverPosition.y}`
    : 'closed'

  return (
    <DropdownMenu key={positionKey} open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        className="w-auto p-0"
        style={{
          position: 'absolute',
          left: chartHighlight?.popoverPosition?.x + 'px' || 0,
          top: chartHighlight?.popoverPosition?.y + 'px' || 0,
        }}
      />
      <DropdownMenuContent
        className="flex flex-col gap-1 p-1 w-fit text-left data-[state=open]:animate-none! data-[state=closed]:animate-none!"
        onEscapeKeyDown={() => clearHighlight?.()}
        onInteractOutside={(e) => {
          const target = e.target as Element | null
          // If the user clicked on a chart, handleMouseDown will manage the new selection.
          // Calling clearHighlight here would race with it and clobber the new state.
          if (target?.closest('.recharts-wrapper')) return
          clearHighlight?.()
        }}
      >
        <DropdownMenuLabel className="flex items-center justify-center text-foreground-light font-mono gap-x-2 text-xs">
          <span>{formatChartDate(toFormattableDate(selectedRangeStart!), 'MMM D, H:mm')}</span>
          <ArrowRight size={10} />
          <span>{formatChartDate(toFormattableDate(selectedRangeEnd!), 'MMM D, H:mm')}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        {allActions.map((action) => {
          const disabled = ctx && action.isDisabled ? action.isDisabled(ctx) : false
          let labelNode: ReactNode = null
          if (typeof action.label === 'function') {
            labelNode = ctx ? action.label(ctx) : null
          } else {
            labelNode = action.label
          }
          let rightNode: ReactNode = null
          if (typeof action.rightSlot === 'function') {
            rightNode = ctx ? action.rightSlot(ctx) : null
          } else {
            rightNode = action.rightSlot ?? null
          }
          return (
            <DropdownMenuItem asChild key={action.id} disabled={disabled} className={cn('group')}>
              <button
                disabled={disabled}
                tabIndex={-1}
                onClick={() => ctx && action.onSelect({ ...ctx })}
                className="w-full flex items-center gap-1.5"
              >
                {action.icon}
                <span className="grow text-left">{labelNode}</span>
                {rightNode}
              </button>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
