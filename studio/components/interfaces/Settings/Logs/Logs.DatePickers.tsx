import { Button, Dropdown, IconClock } from '@supabase/ui'
import { DatePicker } from 'components/ui/DatePicker'
import { useState, useEffect } from 'react'

type ToFrom = { to: string; from: string }
interface Props {
  to?: string
  from?: string
  onChange: ({ to, from }: ToFrom) => void
}

const HELPERS = [
  { text: 'Last hour', value: '1_hour' },
  { text: 'Last 3 hours', value: '3_hour' },
  { text: 'Last day', value: '1_day' },
]
const DEFAULT_HELPER_VALUE = HELPERS[0].value

const DatePickers: React.FC<Props> = ({ to, from, onChange }) => {
  const [helperValue, setHelperValue] = useState<string>('')

  const handleHelperChange = (newValue: string) => {
    setHelperValue(newValue)
    const toDate = new Date()
    const fromDate = {
      '1_hour': new Date(toDate.getTime() - 60 * 60 * 1000),
      '3_hour': new Date(toDate.getTime() - 3 * 60 * 60 * 1000),
      '1_day': new Date(toDate.getTime() - 24 * 60 * 60 * 1000),
    }[newValue]
    if (onChange) onChange({ to: toDate.toISOString(), from: fromDate?.toISOString() as string })
  }
  const selectedHelper = HELPERS.find((h) => h.value === (helperValue || DEFAULT_HELPER_VALUE))
  return (
    <div className="flex items-center">
      <Dropdown
        size="small"
        side="bottom"
        align="start"
        overlay={
          <>
            <Dropdown.RadioGroup
              onChange={handleHelperChange}
              value={helperValue || DEFAULT_HELPER_VALUE}
            >
              {HELPERS.map((helper) => (
                <Dropdown.Radio key={helper.value} value={helper.value}>
                  {helper.text}
                </Dropdown.Radio>
              ))}
            </Dropdown.RadioGroup>
          </>
        }
      >
        <Button
          as="span"
          type={helperValue ? 'alternative' : 'outline'}
          icon={<IconClock size={12} />}
          className="rounded-r-none"
        >
          {selectedHelper?.text}
        </Button>
      </Dropdown>
      <DatePicker
        triggerButtonClassName="rounded-l-none"
        triggerButtonType={helperValue ? 'outline' : 'alternative'}
        onChange={(value: ToFrom) => {
          setHelperValue('')
          if (onChange) onChange(value)
        }}
        to={!helperValue ? to : undefined}
        from={!helperValue ? from : undefined}
      />
    </div>
  )
}

export default DatePickers
