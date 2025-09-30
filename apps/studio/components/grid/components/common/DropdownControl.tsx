import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { PropsWithChildren } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'

interface DropdownControlProps {
  options: {
    value: string | number
    label: string
    postLabel?: string
    preLabel?: string
    disabled?: boolean
    tooltip?: string
  }[]
  onSelect: (value: string | number) => void
  side?: 'bottom' | 'left' | 'top' | 'right' | undefined
  align?: 'start' | 'center' | 'end' | undefined
  className?: string
}

export const DropdownControl = ({
  children,
  side,
  align,
  options,
  onSelect,
  className,
}: PropsWithChildren<DropdownControlProps>) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className}>{children}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align}>
        <div className="dropdown-control" style={{ maxHeight: '30vh' }}>
          {options.length === 0 && <p className="dropdown-control__empty-text">No more items</p>}
          {options.map((x) => {
            return (
              <DropdownMenuItemTooltip
                key={x.value}
                disabled={x.disabled}
                tooltip={{ content: { side: 'right', text: x.tooltip } }}
                onClick={() => onSelect(x.value)}
              >
                <div className="flex items-center gap-2">
                  {x.preLabel && <span className="grow text-foreground-lighter">{x.preLabel}</span>}
                  <span>{x.label}</span>
                  {x.postLabel && <span className="text-foreground-lighter">{x.postLabel}</span>}
                </div>
              </DropdownMenuItemTooltip>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
