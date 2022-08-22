import dayjs from 'dayjs'
import { DateTimeFormats } from './Charts.constants'

const DATE_FORMAT__WITH_TIME = 'MMM D, YYYY, hh:mma'
const DATE_FORMAT__DATE_ONLY = 'MMM D, YYYY'
export interface ChartHeaderProps {
  title?: string
  format?: string
  highlightedValue: number | string
  customDateFormat?: string
  minimalHeader?: boolean
  displayDateInUtc?: boolean
  highlightedLabel?: string
}
const ChartHeader: React.FC<ChartHeaderProps> = ({
  format,
  highlightedValue,
  highlightedLabel,
  customDateFormat,
  title,
  minimalHeader = false,
  displayDateInUtc = false,
}) => {
  let FOCUS_FORMAT = customDateFormat
    ? customDateFormat
    : format == '%'
    ? DateTimeFormats.FULL
    : DateTimeFormats.DATE_ONLY

  const chartTitle = (
    <h3 className={'text-scale-900 ' + (minimalHeader ? 'text-xs' : 'text-sm')}>{title}</h3>
  )

  // let highlightedLabel = ''

  // if (focus) {
  //   if (data) {
  //     highlightedLabel = data[focus]?.[attribute]?.toLocaleString()
  //   } else if (highlightedValue) {
  //     highlightedLabel = highlightedValue?.toLocaleString()
  //   }
  // }

  const highlighted = (
    <h5
      className={`text-scale-1200 text-xl font-normal ${minimalHeader ? 'text-base' : 'text-2xl'}`}
    >
      {highlightedValue}
      <span className="text-lg">{format}</span>
    </h5>
  )
  const date = (
    <h5 className="text-scale-900 text-xs">
      {highlightedLabel}
      {/* {focus && data && data[focus] && day(data[focus].period_start).format(FOCUS_FORMAT)} */}
    </h5>
  )

  if (minimalHeader) {
    return (
      <div className="flex flex-row items-center gap-x-4" style={{ minHeight: '1.8rem' }}>
        {chartTitle}
        <div className="flex flex-row items-baseline gap-x-2">
          {highlighted}
          {date}
        </div>
      </div>
    )
  }

  return (
    <div className="h-16">
      {chartTitle}
      {highlighted}
      {date}
    </div>
  )
}

export default ChartHeader
