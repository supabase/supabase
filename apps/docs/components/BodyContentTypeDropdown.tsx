import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
} from 'ui'
import { useState } from 'react'

type IParamProps = any

const BodyContentTypeDropdown = ({ types, onSelect }: IParamProps) => {
  const [selectedType, setSelectedType] = useState(types[0] || '')
  const myOnSelectType = (type: string) => {
    setSelectedType(type)
    if (onSelect) onSelect(type)
  }

  if (!types || types.length === 0) {
    return <></>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div
          className="
          group
          justify-between
          bg-control
          border
          hover:border-control
          hover:bg-overlay-hover
          border-control px-2 h-[32px] rounded
          font-mono
          flex items-center gap-1 text-foreground-muted text-xs group-hover:text-foreground transition
          "
        >
          <span className="text-foreground text-sm group-hover:text-foreground transition">
            {selectedType}
          </span>
          <IconChevronDown size={14} strokeWidth={2} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-48">
        {types.map((type) => (
          <DropdownMenuItem
            key={type}
            onClick={() => myOnSelectType(type)}
            className="justify-between flex"
          >
            <span className={`${selectedType === type ? 'font-bold' : ''}`}>{type}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
export default BodyContentTypeDropdown
