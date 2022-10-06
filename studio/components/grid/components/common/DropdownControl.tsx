import { FC } from 'react'
import { Dropdown } from 'ui'

interface DropdownControlProps {
  options: {
    value: string | number
    label: string
    postLabel?: string
    preLabel?: string
  }[]
  onSelect: (value: string | number) => void
  className?: string
  side?: 'bottom' | 'left' | 'top' | 'right' | undefined
  align?: 'start' | 'center' | 'end' | undefined
  isNested?: boolean
}

export const DropdownControl: FC<DropdownControlProps> = (p) => {
  const { className, children, side, align, isNested } = p
  return (
    <Dropdown
      className={className}
      side={side}
      align={align}
      overlay={<DropdownItems {...p} />}
      isNested={isNested}
    >
      {children}
    </Dropdown>
  )
}

const DropdownItems: FC<DropdownControlProps> = ({ options, onSelect }) => {
  return (
    <div className="dropdown-control" style={{ maxHeight: '30vh' }}>
      {options.length == 0 && <p className="dropdown-control__empty-text">No more items</p>}
      {options.map((x) => {
        return (
          <Dropdown.Item key={x.value} onClick={() => onSelect(x.value)}>
            <div className="flex items-center gap-2">
              {x.preLabel && <span className="grow text-xs text-scale-900">{x.preLabel}</span>}
              <span>{x.label}</span>
              {x.postLabel && <span className="text-xs text-scale-900">{x.postLabel}</span>}
            </div>
          </Dropdown.Item>
        )
      })}
    </div>
  )
}
