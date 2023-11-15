import { Button, Checkbox, Form, Popover } from 'ui'
import React, { useState } from 'react'
import { Filters, FilterSet } from '.'

interface Props {
  options: FilterSet
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  buttonClassName: string
}

const LogsFilterPopover: React.FC<Props> = ({
  options,
  filters,
  onFiltersChange,
  buttonClassName,
}) => {
  const [open, setOpen] = useState(false)

  const handleReset = () => {
    onFiltersChange({})
    setOpen(false)
  }
  const handleToggle = () => setOpen(!open)
  const checkIsActive = () => {
    const filter = filters[options.key]
    if (typeof filter === 'object' && Object.values(filter).some(Boolean)) {
      return true
    }
    return false
  }

  return (
    <Popover
      className="flex items-center"
      open={open}
      align="end"
      size="medium"
      onOpenChange={handleToggle}
      overlay={
        <Form
          className="w-full"
          initialValues={filters}
          onSubmit={(values, { setSubmitting }) => {
            setSubmitting(true)
            onFiltersChange(values)
            setOpen(false)
          }}
        >
          {({ isSubmitting }: { isSubmitting: boolean }) => (
            <>
              <div className="space-y-4 py-6">
                {options.options.map((x, i: number) => (
                  <React.Fragment key={x.key}>
                    <Checkbox
                      value="true"
                      id={`${options.key}.${x.key}`}
                      className="px-3"
                      label={x.label}
                      description={x.description}
                      size="medium"
                      defaultChecked={(filters?.[options.key] as Filters)?.[x.key] as boolean}
                    />
                    {i !== options.options.length - 1 && <Popover.Separator />}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-default bg-background py-2 px-3">
                <Button size="tiny" type="default" onClick={handleReset} htmlType="button">
                  Clear
                </Button>
                <Button loading={isSubmitting} type="primary" htmlType="submit">
                  Save
                </Button>
              </div>
            </>
          )}
        </Form>
      }
      showClose
      side="bottom"
    >
      <Button
        asChild
        type={checkIsActive() ? 'secondary' : 'default'}
        onClick={handleToggle}
        className={buttonClassName}
      >
        <span>{options.label}</span>
      </Button>
    </Popover>
  )
}

export default LogsFilterPopover
