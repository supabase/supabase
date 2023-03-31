import { useRef, useEffect, useState, FormEvent, KeyboardEvent, ReactNode } from 'react'
import { orderBy, filter, without } from 'lodash'
import {
  Popover,
  IconCheck,
  IconAlertCircle,
  IconSearch,
  IconPlus,
  IconChevronDown,
  Input,
} from 'ui'

import { BadgeDisabled, BadgeSelected } from './Badges'

export interface MultiSelectOption {
  id: string | number
  value: string
  name: string
  description?: string
  disabled: boolean
}

interface Props {
  value: string[]
  options: MultiSelectOption[]
  label?: string
  error?: string
  placeholder?: string | ReactNode
  searchPlaceholder?: string
  descriptionText?: string | ReactNode
  emptyMessage?: string | ReactNode
  disabled?: boolean
  allowDuplicateSelection?: boolean
  onChange?(x: string[]): void
}

/**
 * Copy styling from supabase/ui default.theme
 * input base + standard
 */

export default function MultiSelect({
  options,
  value,
  label,
  error,
  descriptionText,
  placeholder,
  searchPlaceholder = 'Search for option',
  emptyMessage,
  disabled,
  allowDuplicateSelection = false,
  onChange = () => {},
}: Props) {
  const ref = useRef(null)

  const [selected, setSelected] = useState<string[]>(value || [])
  const [searchString, setSearchString] = useState<string>('')
  const [inputWidth, setInputWidth] = useState<number>(128)

  // Selected is `value` if defined, otherwise use local useState
  const selectedOptions = value || selected

  // Calculate width of the Popover
  useEffect(() => {
    setInputWidth(ref.current ? (ref.current as any).offsetWidth : inputWidth)
  }, [ref.current])

  const width = `${inputWidth}px`

  // Order the options so disabled items are at the beginning
  const formattedOptions = orderBy(options, ['disabled'], ['desc'])

  // Options to show in Popover menu
  const filteredOptions =
    searchString.length > 0
      ? filter(formattedOptions, (option) => !option.disabled && option.name.includes(searchString))
      : filter(formattedOptions, { disabled: false })

  const checkIfActive = (option: MultiSelectOption) => {
    const isOptionSelected = (selectedOptions || []).find((x) => x === option.value)
    return isOptionSelected !== undefined
  }

  const handleRemove = (idx: number) => {
    const updatedSelected = selected.filter((x, index) => index !== idx)
    setSelected(updatedSelected)
    onChange(updatedSelected)
  }

  const handleChange = (option: MultiSelectOption) => {
    const _selected = selectedOptions
    const isActive = checkIfActive(option)

    const updatedPayload = allowDuplicateSelection
      ? [..._selected.concat([option.value])]
      : isActive
      ? [...without(_selected, option.value)]
      : [..._selected.concat([option.value])]

    // Payload must always include disabled options
    const compulsoryOptions = options
      .filter((option) => option.disabled)
      .map((option) => option.name)

    const formattedPayload = allowDuplicateSelection
      ? updatedPayload.concat(compulsoryOptions)
      : [...new Set(updatedPayload.concat(compulsoryOptions))]

    setSelected(formattedPayload)
    onChange(formattedPayload)
  }

  const onKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchString.length > 0 && filteredOptions.length === 1) {
        handleChange(filteredOptions[0])
      }
    }
  }

  return (
    <div className={`form-group ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {label && <label className="!w-full">{label}</label>}
      <div
        className={[
          'form-control form-control--multi-select',
          'border border-scale-700 bg-scaleA-200',
          'multi-select relative block w-full w-full space-x-1 overflow-auto rounded',
          `${error !== undefined ? 'border-red-800 bg-red-100' : ''}`,
        ].join(' ')}
        ref={ref}
      >
        <Popover
          sideOffset={4}
          side="bottom"
          align="start"
          style={{ width }}
          header={
            <div className="flex items-center space-x-2 py-1">
              <IconSearch size={14} />
              <input
                autoFocus
                className="w-72 bg-transparent text-sm placeholder-scale-1000 outline-none"
                value={searchString}
                placeholder={searchPlaceholder}
                onKeyPress={onKeyPress}
                onChange={(e: FormEvent<HTMLInputElement>) =>
                  setSearchString(e.currentTarget.value)
                }
              />
            </div>
          }
          overlay={
            <div className="max-h-[225px] space-y-1 overflow-y-auto p-1">
              {filteredOptions.length >= 1 ? (
                filteredOptions.map((option) => {
                  const active =
                    !allowDuplicateSelection &&
                    selectedOptions &&
                    selectedOptions.find((selected) => {
                      return selected === option.value
                    })
                      ? true
                      : false

                  return (
                    <div
                      key={`multiselect-option-${option.id}`}
                      onClick={() => handleChange(option)}
                      className={[
                        'text-typography-body-light dark:text-typography-body-dark',
                        'group flex cursor-pointer items-center justify-between transition',
                        'space-x-1 rounded bg-transparent p-2 px-4 text-sm hover:bg-gray-600',
                        `${active ? ' dark:bg-green-600 dark:bg-opacity-25' : ''}`,
                      ].join(' ')}
                    >
                      <div className="flex items-center space-x-2">
                        <p>{option.name}</p>
                        {option.description !== undefined && (
                          <p className="opacity-50">{option.description}</p>
                        )}
                      </div>
                      {active && (
                        <IconCheck
                          size={16}
                          strokeWidth={3}
                          className={`cursor-pointer transition ${
                            active ? ' dark:text-green-500' : ''
                          }`}
                        />
                      )}
                      {allowDuplicateSelection && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition space-x-1">
                          <IconPlus size={14} />
                          <p className="text-sm">Add value</p>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : options.length === 0 ? (
                <div
                  className={[
                    'flex h-full w-full flex-col dark:border-dark',
                    'items-center justify-center border border-dashed p-3',
                  ].join(' ')}
                >
                  {emptyMessage ? (
                    emptyMessage
                  ) : (
                    <div className="flex w-full items-center space-x-2">
                      <IconAlertCircle strokeWidth={1.5} size={18} className="text-scale-1000" />
                      <p className="text-sm text-scale-1000">No options available</p>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={[
                    'flex h-full w-full flex-col dark:border-dark',
                    'items-center justify-center border border-dashed p-3',
                  ].join(' ')}
                >
                  {emptyMessage ? (
                    emptyMessage
                  ) : (
                    <div className="flex w-full items-center space-x-2">
                      <p className="text-sm text-scale-1000">No options found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          }
          onOpenChange={() => setSearchString('')}
        >
          <div
            className={[
              'flex w-full flex-wrap items-start gap-1.5 p-1.5 cursor-default',
              `${selectedOptions.length === 0 ? 'h-9' : ''}`,
            ].join(' ')}
          >
            {selectedOptions.length === 0 && placeholder && (
              <div className="px-2 text-sm text-scale-1000 h-full flex items-center">
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
                  <BadgeSelected
                    key={id}
                    name={value}
                    handleRemove={() =>
                      allowDuplicateSelection ? handleRemove(idx) : handleChange(option)
                    }
                  />
                )
              }
            })}
            <div className="absolute inset-y-0 right-0 pl-3 pr-2 flex space-x-1 items-center cursor-pointer ">
              <IconChevronDown size={16} strokeWidth={2} className="text-scale-900" />
            </div>
          </div>
        </Popover>
      </div>

      {descriptionText && (
        <span className="form-text text-muted mt-2 text-sm">{descriptionText}</span>
      )}
      {error && <span className="text-red-900 text-sm mt-2">{error}</span>}
    </div>
  )
}
