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
          flex items-center gap-1
          text-foreground text-sm group-hover:text-foreground transition
          "
        >
          {selectedType}
          <IconChevronDown size={14} strokeWidth={2} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-48">
        {types.map((type) => (
          <DropdownMenuItem
            key={type}
            onClick={() => myOnSelectType(type)}
            className={`justify-between flex ${selectedType === type ? 'font-bold' : ''}`}
          >
            {type}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
export default BodyContentTypeDropdown
