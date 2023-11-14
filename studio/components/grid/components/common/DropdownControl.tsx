import { PropsWithChildren } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

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
    <DropdownMenu>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align}>
        <div className="dropdown-control" style={{ maxHeight: '30vh' }}>
          {options.length === 0 && <p className="dropdown-control__empty-text">No more items</p>}
          {options.map((x) => {
            return (
              <DropdownMenuItem key={x.value} onClick={() => onSelect(x.value)}>
                <div className="flex items-center gap-2">
                  {x.preLabel && <span className="grow text-foreground-lighter">{x.preLabel}</span>}
                  <span>{x.label}</span>
                  {x.postLabel && <span className="text-foreground-lighter">{x.postLabel}</span>}
                </div>
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
