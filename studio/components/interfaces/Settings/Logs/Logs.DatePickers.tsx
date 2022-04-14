import { Button, Dropdown, IconClock } from '@supabase/ui'
import { DatePicker } from 'components/ui/DatePicker'
import { useState, useEffect } from 'react'

type ToFrom = { to: string; from: string }
interface Props {
  to: string
  from: string
  onChange: ({ to, from }: ToFrom) => void
  helpers?: Helper[]
  changeOnMount?: boolean
}
interface Helper {
  text: string
  calcTo: () => string
  calcFrom: () => string
}

const DEFAULT_HELPERS: Helper[] = [
  {
    text: 'Last hour',
    calcTo: () => new Date(new Date().getTime() - 60 * 60 * 1000).toISOString(),
    calcFrom: () => '',
  },
  {
    text: 'Last 3 hours',
    calcTo: () => new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString(),
    calcFrom: () => '',
  },
  {
    text: 'Last day',
    calcTo: () => new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
    calcFrom: () => '',
  },
]

const DatePickers: React.FC<Props> = ({
  to,
  from,
  onChange,
  helpers = DEFAULT_HELPERS,
  changeOnMount = false,
}) => {
  const defaultHelper = helpers[0]
  const [helperValue, setHelperValue] = useState<string>(to || from ? '' : defaultHelper.text)
  const selectedHelper = helpers.find((h) => h.text === helperValue)
  const handleHelperChange = (newValue: string) => {
    setHelperValue(newValue)
    const selectedHelper = helpers.find((h) => h.text === newValue)
    if (onChange && selectedHelper) {
      onChange({ to: selectedHelper.calcTo(), from: selectedHelper.calcFrom() })
    }
  }
  // trigger change if flag is provided
  useEffect(() => {
    if (changeOnMount) {
      handleHelperChange(helperValue)
    }
  }, [])

  return (
    <div className="flex items-center">
      <Dropdown
        size="small"
        side="bottom"
        align="start"
        overlay={
          <>
            <Dropdown.RadioGroup onChange={handleHelperChange} value={selectedHelper?.text || ''}>
              {helpers.map((helper) => (
                <Dropdown.Radio key={helper.text} value={helper.text}>
                  {helper.text}
                </Dropdown.Radio>
              ))}
            </Dropdown.RadioGroup>
          </>
        }
      >
        <Button
          as="span"
          type={helperValue ? 'secondary' : 'default'}
          icon={<IconClock size={12} />}
          className="rounded-r-none"
        >
          {selectedHelper?.text  || defaultHelper.text}
        </Button>
      </Dropdown>
      <DatePicker
        triggerButtonClassName="rounded-l-none"
        triggerButtonType={helperValue ? 'default' : 'secondary'}
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
