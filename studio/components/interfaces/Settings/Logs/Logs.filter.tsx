import { Button, Checkbox, Form, Popover } from '@supabase/ui'
import { pluckObjectFields } from 'lib/helpers'
import { useState } from 'react'

export const LogsFilter = ({ options, filtersState, dispatchFilters }: any) => {
  const [open, setOpen] = useState(false)

  function handleReset() {
    // console.log('handleReset ran!')
    const empty = {
      [options.key]: [],
    }

    dispatchFilters({ ...empty })
    setOpen(!open)
  }

  // console.log('filters', filters)

  //   console.log('item in filter', options)
  // console.log('options.key', options.key)

  const filteredKey = filtersState[options.key]

  // loop through options in saved filters
  // and check if any options are active
  function checkIsActive() {
    let active = false
    options.options.map((x: any) => {
      if (filteredKey && filteredKey.includes(x.key)) {
        active = true
      }
    })
    return active
  }

  const isActive = checkIsActive()

  function initialValues() {
    let compiledOptions = {}

    options.options.map((x: any) => {
      compiledOptions = {
        ...compiledOptions,
        [x.key]: filteredKey && filteredKey.includes(x.key) ? true : false,
      }
    })

    return compiledOptions
  }

  return (
    <div className="flex items-center">
      <Popover
        open={open}
        align="end"
        size="medium"
        onOpenChange={() => setOpen(!open)}
        overlay={
          <>
            <Form
              initialValues={initialValues()}
              onSubmit={(values: any, { setSubmitting, handleReset }: any) => {
                setSubmitting(true)
                setOpen(false)

                // console.log('values in Logs.filter submit', values)

                const payload: any = {
                  [options.key]: [],
                }

                Object.keys(values).map((filterKey) => {
                  if (values[filterKey]) {
                    payload[options.key].push(filterKey)
                  }
                })

                // console.log('payload', payload)
                // console.log('submit form ran')
                dispatchFilters({ ...payload })
                handleReset()
              }}
            >
              {({ isSubmitting }: { isSubmitting: boolean }) => (
                <>
                  <div className="py-6 space-y-4">
                    {options.options.map((x: any, i: number) => {
                      return (
                        <>
                          <Checkbox
                            id={x.key}
                            className="px-3"
                            label={x.label}
                            description={x.description}
                            size="medium"
                          />
                          {i !== options.options.length - 1 && <Popover.Seperator />}
                        </>
                      )
                    })}
                  </div>
                  <div
                    className="flex items-center justify-end gap-2
                bg-scale-200 dark:bg-scale-400 py-2 px-3
                border-t border-scale-400 dark:border-scale-500
              "
                  >
                    <Button
                      size="tiny"
                      type="default"
                      onClick={() => handleReset()}
                      htmlType="button"
                    >
                      Clear
                    </Button>
                    <Button loading={isSubmitting} type="primary" htmlType="submit">
                      Save
                    </Button>
                  </div>
                </>
              )}
            </Form>
          </>
        }
        portalled
        showClose
        side="bottom"
      >
        <Button as="span" type={isActive ? 'secondary' : 'default'} onClick={() => setOpen(!open)}>
          {options.label}
        </Button>
      </Popover>
    </div>
  )
}
