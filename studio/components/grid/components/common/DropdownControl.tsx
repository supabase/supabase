import { PropsWithChildren } from 'react'
import {
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
} from 'ui'

interface DropdownControlProps {
  options: {
    value: string | number
    label: string
    postLabel?: string
    preLabel?: string
  }[]
  onSelect: (value: string | number) => void
  side?: 'bottom' | 'left' | 'top' | 'right' | undefined
  align?: 'start' | 'center' | 'end' | undefined
}

export const DropdownControl = ({
  children,
  side,
  align,
  options,
  onSelect,
}: PropsWithChildren<DropdownControlProps>) => {
  return (
    <DropdownMenu_Shadcn_>
      <DropdownMenuTrigger_Shadcn_>{children}</DropdownMenuTrigger_Shadcn_>
      <DropdownMenuContent_Shadcn_ side={side} align={align}>
        <div className="dropdown-control" style={{ maxHeight: '30vh' }}>
          {options.length === 0 && <p className="dropdown-control__empty-text">No more items</p>}
          {options.map((x) => {
            return (
              <DropdownMenuItem_Shadcn_ key={x.value} onClick={() => onSelect(x.value)}>
                <div className="flex items-center gap-2">
                  {x.preLabel && <span className="grow text-xs text-scale-900">{x.preLabel}</span>}
                  <span>{x.label}</span>
                  {x.postLabel && <span className="text-xs text-scale-900">{x.postLabel}</span>}
                </div>
              </DropdownMenuItem_Shadcn_>
            )
          })}
        </div>
      </DropdownMenuContent_Shadcn_>
    </DropdownMenu_Shadcn_>
  )
}
