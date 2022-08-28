import { useRef, useEffect, useState, FormEvent, KeyboardEvent, ReactNode } from 'react'
import { orderBy, filter, without } from 'lodash'
import { Popover, IconCheck, IconAlertCircle, IconSearch } from '@supabase/ui'

import { BadgeDisabled, BadgeSelected } from './Badges'

export interface MultiSelectOption {
  id: string | number
  value: string
  name: string
  disabled: boolean
}

interface Props {
  options: MultiSelectOption[]
  value: string[]
  label?: string
  placeholder?: string | ReactNode
  searchPlaceholder?: string
  descriptionText?: string | ReactNode
  emptyMessage?: string | ReactNode
  disabled?: boolean
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
  descriptionText,
  placeholder,
  searchPlaceholder = 'Search for option',
  emptyMessage,
  disabled,
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
  }, [])

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

  const onKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchString.length > 0 && filteredOptions.length === 1) {
        handleChange(filteredOptions[0])
      }
    }
  }

  return (
    <div className={`form-group ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {label && <label>{label}</label>}
      <div
        className={[
          'form-control form-control--multi-select',
          'bg-scaleA-200 border-scale-700 border',
          'multi-select relative block w-full w-full space-x-1 overflow-auto rounded',
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
                className="placeholder-scale-1000 w-72 bg-transparent text-sm outline-none"
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
                    selectedOptions &&
                    selectedOptions.find((selected) => {
                      return selected === option.value
                    })
                      ? true
                      : false

                  return (
                    <div
                      key={`multiselect-option-${option.value}`}
                      onClick={() => handleChange(option)}
                      className={[
                        'text-typography-body-light dark:text-typography-body-dark',
                        'flex cursor-pointer items-center justify-between transition',
                        'space-x-1 rounded bg-transparent p-2 px-4 text-sm hover:bg-gray-600',
                        `${active ? ' dark:bg-green-600 dark:bg-opacity-25' : ''}`,
                      ].join(' ')}
                    >
                      <span>{option.name}</span>
                      {active && (
                        <IconCheck
                          size={16}
                          strokeWidth={3}
                          className={`cursor-pointer transition ${
                            active ? ' dark:text-green-500' : ''
                          }`}
                        />
                      )}
                    </div>
                  )
                })
              ) : options.length === 0 ? (
                <div
                  className={[
                    'dark:border-dark flex h-full w-full flex-col',
                    'items-center justify-center border border-dashed p-3',
                  ].join(' ')}
                >
                  {emptyMessage ? (
                    emptyMessage
                  ) : (
                    <div className="flex w-full items-center space-x-2">
                      <IconAlertCircle strokeWidth={1.5} size={18} className="text-scale-1000" />
                      <p className="text-scale-1000 text-sm">No options available</p>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={[
                    'dark:border-dark flex h-full w-full flex-col',
                    'items-center justify-center border border-dashed p-3',
                  ].join(' ')}
                >
                  {emptyMessage ? (
                    emptyMessage
                  ) : (
                    <div className="flex w-full items-center space-x-2">
                      <p className="text-scale-1000 text-sm">No options found</p>
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
              'flex w-full flex-wrap items-start items-center gap-1.5 p-1.5',
              `${selectedOptions.length === 0 ? 'h-9' : ''}`,
            ].join(' ')}
          >
            {selectedOptions.length === 0 && placeholder && (
              <div className="text-scale-1000 px-2 text-sm">{placeholder}</div>
            )}
            {formattedOptions.map((option) => {
              const active =
                selectedOptions &&
                selectedOptions.find((selected) => {
                  return selected === option.value
                })

              if (option.disabled) {
                return <BadgeDisabled key={option.id} name={option.name} />
              } else if (active) {
                return (
                  <BadgeSelected
                    key={option.id}
                    name={option.name}
                    handleRemove={() => handleChange(option)}
                  />
                )
              }
            })}
          </div>
        </Popover>
      </div>

      {descriptionText && <span className="form-text text-muted">{descriptionText}</span>}
    </div>
  )
}
