import { Button, Dropdown, IconClock } from '@supabase/ui'
import { DatePicker } from 'components/ui/DatePicker'

const DatePickers = ({
  to,
  from,
  //   defaultValues,
  onChange,
}: {
  to?: number
  from?: number
  defaultValues?: any
  onChange: ({}) => void
}) => {
  return (
    <div className="flex items-center">
      <Dropdown
        size="small"
        side="bottom"
        align="start"
        overlay={
          <>
            <Dropdown.RadioGroup onChange={(e) => console.log(e)} value={'1_hour'}>
              <Dropdown.Radio value="1_hour">1 hour</Dropdown.Radio>
              <Dropdown.Radio value="3_hour">Last 3 hour</Dropdown.Radio>
              <Dropdown.Radio value="1_day">Last day</Dropdown.Radio>
            </Dropdown.RadioGroup>
          </>
        }
      >
        <Button as="span" type="default" icon={<IconClock size={12} />}>
          Last hour
        </Button>
      </Dropdown>
      <DatePicker onChange={onChange} to={to} from={from} />
    </div>
  )
}

export default DatePickers
