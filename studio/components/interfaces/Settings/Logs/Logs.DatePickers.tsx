import { DatePicker } from 'components/ui/DatePicker'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  IconClock,
} from 'ui'
import { DatetimeHelper, getDefaultHelper, LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD } from '.'

interface Props {
  to: string
  from: string
  onChange: React.ComponentProps<typeof DatePicker>['onChange']
  helpers: DatetimeHelper[]
}
const DatePickers: React.FC<Props> = ({ to, from, onChange, helpers }) => {
  const defaultHelper = getDefaultHelper(helpers)
  const [helperValue, setHelperValue] = useState<string>(to || from ? '' : defaultHelper.text)

  const handleHelperChange = (newValue: string) => {
    const selectedHelper = helpers.find((h) => h.text === newValue)

    if (onChange && selectedHelper) {
      onChange({ to: selectedHelper.calcTo(), from: selectedHelper.calcFrom() })
    }
  }

  const selectedHelper = helpers.find((helper) => {
    if (to === helper.calcTo() && from === helper.calcFrom()) {
      return true
    } else {
      return false
    }
  })

  useEffect(() => {
    if (selectedHelper && helperValue !== selectedHelper.text) {
      setHelperValue(selectedHelper.text)
    } else if (!selectedHelper && (to || from)) {
      setHelperValue('')
    }
  }, [selectedHelper, to, from])

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            asChild
            type={helperValue ? 'secondary' : 'default'}
            icon={<IconClock size={12} />}
            className="rounded-r-none"
          >
            <span>{selectedHelper?.text || defaultHelper.text}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuRadioGroup
            onValueChange={handleHelperChange}
            value={selectedHelper?.text || ''}
          >
            {helpers.map((helper) => (
              <DropdownMenuRadioItem
                key={helper.text}
                value={helper.text}
                disabled={helper.disabled}
              >
                <span
                  className={[
                    helper.disabled ? 'text-foreground-light cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  {helper.text}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DatePicker
        triggerButtonClassName="rounded-l-none"
        triggerButtonType={selectedHelper ? 'default' : 'secondary'}
        triggerButtonTitle="Custom"
        onChange={(value) => {
          setHelperValue('')
          if (onChange) onChange(value)
        }}
        to={!helperValue ? to : undefined}
        from={!helperValue ? from : undefined}
        renderFooter={({ to, from }) => {
          if (
            to &&
            from &&
            Math.abs(dayjs(from).diff(dayjs(to), 'day')) > LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD
          ) {
            return (
              <Alert title={''} variant="warning" className="mx-3 pl-2 pr-2 pt-1 pb-2">
                Large ranges may result in memory errors for big projects.
              </Alert>
            )
          }
        }}
      />
    </div>
  )
}

export default DatePickers
