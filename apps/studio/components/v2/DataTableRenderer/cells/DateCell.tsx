import { getColumnType } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/DateTimeInput/DateTimeInput.utils'
import dayjs from 'dayjs'
import { DATETIME_FORMAT } from 'lib/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface DateCellProps {
  value: unknown
  showTime?: boolean
}

function formatFull(date: Date, showTime: boolean): string {
  const valueType = getColumnType(showTime ? 'timestamp' : 'date')
  if (valueType === 'date') return dayjs(date).format('YYYY-MM-DD')
  if (valueType === 'time') return dayjs(date).format('HH:mm:ss')
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export function DateCell({ value, showTime = false }: DateCellProps) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-foreground-lighter italic">NULL</span>
  }

  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    return <span className="truncate text-foreground-lighter">{String(value)}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="truncate cursor-default">{dayjs(date).format(DATETIME_FORMAT)}</span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className="font-mono text-xs">{formatFull(date, showTime)}</span>
      </TooltipContent>
    </Tooltip>
  )
}
