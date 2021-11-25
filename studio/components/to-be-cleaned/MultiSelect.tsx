/*
 * Move this to @supabase/ui
 *
 * can be merged into ListBox
 *
 */

import React, { useRef } from 'react'

import { Popover, IconX, IconCheck, Typography, IconAlertCircle } from '@supabase/ui'
import { useEffect, useState } from 'react'

import { orderBy, filter, without } from 'lodash'

interface Options {
  id: string
  value: string
  name: string
  disabled: boolean
}
interface Props {
  options: Options[]
  value: string[]
  onChange?(x: string[]): void
  label: string
  descriptionText: string | React.ReactNode
  emptyMessage: React.ReactNode
}

export default function MultiSelect({
  options,
  value,
  onChange = () => {},
  label,
  descriptionText,
  emptyMessage,
}: Props) {
  const ref = useRef(null)

  const [selectedd, setSelected] = useState(value || [])
  const [inputWidth, setInputWidth] = useState(128)

  /*
   * Selected is `value` if defined, otherwise use local useState
   */
  const selected = value || selectedd

  /*
   * Calculate width of the Popover
   */
  useEffect(() => {
    setInputWidth(ref.current ? (ref.current as any).offsetWidth : inputWidth)
  }, [])

  const width = `${inputWidth}px`

  /*
   * order the options so disabled items are at the beginning
   */
  options = orderBy(options, ['disabled'], ['desc'])

  /*
   * options to show in Popover menu
   */
  const optionsFiltered = filter(options, { disabled: false })

  function handleChange(value: any, active: any) {
    let _selected = selected
    if (active) {
      const payload = [...without(_selected, value)]
      setSelected(payload)
      onChange(payload)
    } else {
      _selected.push(value)
      const payload = [..._selected]
      setSelected(payload)
      onChange(payload)
    }
  }

  return (
    <>
      <div className="form-group">
        <label>{label}</label>

        <div
          className="form-control form-control--multi-select relative border rounded border-input-border-light dark:border-input-border-dark dark:border-dark space-x-1 overflow-auto"
          ref={ref}
        >
          {/* {options.map(x => {
            const active =
              selected &&
              selected.find(selected => {
                return selected === x.value
              })
            if (x.disabled) {
              return <span>{x.name}</span>
            } else if (active) {
              return <span>{x.name}</span>
            }
          })} */}
          <Popover
            sideOffset={4}
            side="bottom"
            align="start"
            overlay={
              <div className="space-y-1 p-1 overflow-auto">
                {optionsFiltered.length >= 1 ? (
                  optionsFiltered.map((x) => {
                    const active =
                      selected &&
                      selected.find((selected) => {
                        return selected === x.value
                      })
                        ? true
                        : false

                    return (
                      <div
                        key={`multiselect-option-${x.value}`}
                        onClick={() => handleChange(x.value, active)}
                        className={`
                transition 
                bg-transparent hover:bg-gray-600
                rounded p-2 px-4 
                text-sm text-typography-body-light dark:text-typography-body-dark 
                flex items-center justify-between space-x-1 
                cursor-pointer ${active ? ' dark:bg-green-600 dark:bg-opacity-25' : ''}
                
                `}
                      >
                        <span>{x.name}</span>
                        {active && (
                          <IconCheck
                            size={16}
                            strokeWidth={3}
                            className={`transition cursor-pointer ${
                              active ? ' dark:text-green-500' : ''
                            }`}
                          />
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div
                    className="
                      h-full w-full p-3
                      border border-dashed dark:border-dark
                      flex flex-col items-center justify-center
                    "
                  >
                    {emptyMessage ? (
                      emptyMessage
                    ) : (
                      <>
                        <Typography.Text className="mb-2">
                          <IconAlertCircle />
                        </Typography.Text>
                        <Typography.Text>No options available</Typography.Text>
                      </>
                    )}
                  </div>
                )}
              </div>
            }
            style={{
              width: width,
            }}
          >
            <div className="flex items-center space-x-1 w-full p-1.5">
              {options.map((x) => {
                const active =
                  selected &&
                  selected.find((selected) => {
                    return selected === x.value
                  })

                if (x.disabled) {
                  return <BadgeDisabled key={x.id} name={x.name} />
                } else if (active) {
                  return (
                    <BadgeSelected
                      key={x.id}
                      name={x.name}
                      id={x.name}
                      value={x.value}
                      handleRemove={() => handleChange(x.value, true)}
                    />
                  )
                }
              })}
            </div>
          </Popover>
        </div>

        <span className="form-text text-muted">{descriptionText}</span>
      </div>
    </>
  )
}

const BadgeDisabled = (props: any) => (
  <div
    className="
      bg-gray-600 cursor-not-allowed rounded py-0.5 px-2 text-sm text-typography-body-light dark:text-typography-body-dark
        flex items-center
        space-x-2"
  >
    <span className="opacity-50">{props.name}</span>
  </div>
)

const BadgeSelected = (props: any) => (
  <div
    className="
      bg-gray-500 rounded py-0.5 px-2 text-sm text-typography-body-light dark:text-typography-body-dark
        flex items-center
        space-x-2"
  >
    <span>{props.name}</span>
    <IconX
      size={12}
      className="transition cursor-pointer opacity-50 hover:opacity-100"
      onClick={(e: any) => {
        e.preventDefault()
        props.handleRemove()
      }}
    />
  </div>
)
