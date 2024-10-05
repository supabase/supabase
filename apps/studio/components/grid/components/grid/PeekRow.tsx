import { Check, Eye, Calendar, Circle, Hash, ToggleRight, Type, ListPlus, Copy } from 'lucide-react'

import { PopoverSeparator } from '@ui/components/shadcn/ui/popover'
import {
  Button,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'
import { copyToClipboard } from '../../utils/common'
import { useTrackedState } from '../../store/Store'
import { SupaRow } from 'components/grid/types'
import { useState } from 'react'

export const PeekRow = ({ row }: { row: SupaRow }) => {
  const state = useTrackedState()
  const tableColumnMap = state.table?.columns

  // [terry] move this from ColumnType.tsx to a common place instead of copying here
  const inferIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash size={12} className="text-foreground" strokeWidth={1.5} />
      case 'bigint':
        return <Hash size={12} className="text-foreground" strokeWidth={1.5} />
      case 'time':
        return <Calendar size={12} className="text-foreground" strokeWidth={1.5} />
      case 'text':
        return <Type size={12} className="text-foreground" strokeWidth={1.5} />
      case 'json':
        return (
          <div className="text-foreground" style={{ padding: '0px 1px' }}>
            {'{ }'}
          </div>
        )
      case 'bool':
        return <ToggleRight size={12} className="text-foreground" strokeWidth={1.5} />
      case 'USER-DEFINED':
        return <ListPlus size={12} className="text-foreground" strokeWidth={1.5} />
      default:
        return <Circle size={12} className="text-foreground p-0.5" strokeWidth={1.5} />
    }
  }
  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="text"
          className="h-[26px] w-[26px] opacity-0 group-hover:opacity-100 transition-opacity"
          icon={<Eye />}
        />
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        side="right"
        sideOffset={10}
        avoidCollisions
        className="w-auto p-0 z-50 "
        collisionBoundary={document.querySelector('.sb-grid')}
        collisionPadding={80}
      >
        <ScrollArea className="max-h-[400px] w-[400px] border-r">
          <div className="grid gap-3 p-5 text-xs">
            {Object.entries(row)
              .filter(([key]) => key !== 'idx')
              .map(([key, value]) => {
                const column = tableColumnMap?.find((col) => col.name === key)
                const dataType = column?.dataType || 'unknown'
                return (
                  <PeekRowItem
                    key={key}
                    columnKey={key}
                    value={value}
                    dataType={dataType}
                    inferIcon={inferIcon}
                  />
                )
              })}
          </div>
        </ScrollArea>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

interface PeekRowItemProps {
  columnKey: string
  value: any
  dataType: string
  inferIcon: (dataType: string) => React.ReactNode
}

export const PeekRowItem = ({ columnKey, value, dataType, inferIcon }: PeekRowItemProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="flex justify-between items-center gap-2">
      <span className="font-semibold flex items-center gap-2 bg-surface-200 rounded-md py-0.5 px-1 font-mono">
        {inferIcon(dataType)}
        {columnKey}
      </span>
      <PopoverSeparator />
      <div className="flex flex-col items-end relative">
        <Button
          type="text"
          className="relative"
          onClick={() => {
            copyToClipboard(value)
            setIsCopied(true)
            setTimeout(() => {
              setIsCopied(false)
            }, 2000)
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span
            className="absolute top-1.5 -right-4 transition-opacity duration-200"
            style={{ opacity: isHovered || isCopied ? 1 : 0 }}
          >
            {isCopied ? <Check size={12} /> : <Copy size={12} />}
          </span>
          <span className="truncate overflow-hidden max-w-[225px] max-w flex">
            {value !== null ? String(value) : 'null'}
          </span>
        </Button>
      </div>
    </div>
  )
}
