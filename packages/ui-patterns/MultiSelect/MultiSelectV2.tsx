import { orderBy, without } from 'lodash'
import { Check, ChevronDown } from 'lucide-react'
import { ReactNode, useState } from 'react'
import {
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  cn,
} from 'ui'
import { BadgeDisabled, BadgeSelected } from './Badges'

interface MultiSelectOption {
  id: string | number
  value: string
  name: string
  description?: string
  disabled: boolean
}

interface MultiSelectProps {
  value: string[]
  options: MultiSelectOption[]
  placeholder?: string | ReactNode
  searchPlaceholder?: string
  disabled?: boolean
  onChange?(x: string[]): void
}

export const MultiSelectV2 = ({
  options,
  value,
  placeholder,
  searchPlaceholder = 'Search for option',
  disabled = false,
  onChange = () => {},
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>(value || [])

  // Selected is `value` if defined, otherwise use local useState
  const selectedOptions = value || selected

  // Order the options so disabled items are at the beginning
  const formattedOptions = orderBy(options, ['disabled'], ['desc'])

  const checkIfActive = (option: MultiSelectOption) => {
    const isOptionSelected = (selectedOptions || []).find((x) => x === option.value)
    return isOptionSelected !== undefined
  }

  const handleChange = (option: MultiSelectOption) => {
    const _selected = selectedOptions
    const isActive = checkIfActive(option)

    const updatedPayload = isActive
      ? [...without(_selected, option.value)]
      : [..._selected.concat([option.value])]

    // Payload must always include disabled options
    const compulsoryOptions = options
      .filter((option) => option.disabled)
      .map((option) => option.name)

    const formattedPayload = [...new Set(updatedPayload.concat(compulsoryOptions))]

    setSelected(formattedPayload)
    onChange(formattedPayload)
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <div
            className={cn(
              'relative border border-strong bg-control rounded',
              'flex w-full flex-wrap items-start gap-1.5 p-1.5 cursor-pointer',
              `${selectedOptions.length === 0 ? 'h-9' : ''}`
            )}
            onClick={() => setOpen(true)}
          >
            {selectedOptions.length === 0 && placeholder && (
              <div className="px-2 text-sm text-foreground-light h-full flex items-center">
                {placeholder}
              </div>
            )}
            {selectedOptions.map((value, idx) => {
              const id = `${value}-${idx}`
              const option = formattedOptions.find((x) => x.value === value)
              const isDisabled = option?.disabled ?? false
              if (!option) {
                return <></>
              } else if (isDisabled) {
                return <BadgeDisabled key={id} name={value} />
              } else {
                return (
                  <BadgeSelected key={id} name={value} handleRemove={() => handleChange(option)} />
                )
              }
            })}
            <div className="absolute inset-y-0 right-0 pl-3 pr-2 flex space-x-1 items-center cursor-pointer ">
              <ChevronDown size={16} strokeWidth={2} className="text-foreground-lighter" />
            </div>
          </div>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0 w-96 border-strong" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder={searchPlaceholder} />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No options found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                <ScrollArea className={cn(formattedOptions.length > 5 ? 'h-[225px]' : '')}>
                  {formattedOptions?.map((option) => {
                    const active =
                      selectedOptions &&
                      selectedOptions.find((selected) => {
                        return selected === option.value
                      })
                        ? true
                        : false
                    return (
                      <CommandItem_Shadcn_
                        key={option.id}
                        value={option.value}
                        className="cursor-pointer w-full"
                        onClick={() => handleChange(option)}
                        onSelect={() => handleChange(option)}
                      >
                        <div className="w-full flex items-center justify-between">
                          {option.name}
                          {active && <Check size={14} />}
                        </div>
                      </CommandItem_Shadcn_>
                    )
                  })}
                </ScrollArea>
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}
