import { Button, IconRefreshCw } from 'ui'
import DatePickers from '../Settings/Logs/Logs.DatePickers'
import { REPORTS_DATEPICKER_HELPERS } from './Reports.constants'

interface Props {
  title: string
  onDatepickerChange: React.ComponentProps<typeof DatePickers>['onChange']
  datepickerTo?: string
  datepickerFrom?: string
  onRefresh: () => void
  isLoading: boolean
}

const ReportHeader: React.FC<Props> = ({
  title,
  onDatepickerChange,
  datepickerTo = '',
  datepickerFrom = '',
  onRefresh,
  isLoading,
}) => (
  <div className="flex flex-col gap-4">
    <h1 className="text-2xl text-scale-1200">{title}</h1>
    <div className="flex flex-row justify-start gap-4">
      <DatePickers
        onChange={onDatepickerChange}
        to={datepickerTo}
        from={datepickerFrom}
        helpers={REPORTS_DATEPICKER_HELPERS}
      />
      <Button
        type="default"
        size="tiny"
        onClick={onRefresh}
        disabled={isLoading ? true : false}
        icon={
          <IconRefreshCw
            size="tiny"
            className={`text-scale-1100 ${isLoading ? 'animate-spin' : ''}`}
          />
        }
      >
        Refresh
      </Button>
    </div>
  </div>
)
export default ReportHeader
