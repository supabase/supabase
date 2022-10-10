import { DateTimeFormats } from './Charts.constants'

export interface ChartHeaderProps {
  title?: string
  format?: string
  customDateFormat?: string
  minimalHeader?: boolean
  displayDateInUtc?: boolean
  highlightedLabel?: number | string | null
  highlightedValue?: number | string | null
}
const ChartHeader: React.FC<ChartHeaderProps> = ({
  format,
  highlightedValue,
  highlightedLabel,
  title,
  minimalHeader = false,
}) => {
  const chartTitle = (
    <h3 className={'text-scale-900 ' + (minimalHeader ? 'text-xs' : 'text-sm')}>{title}</h3>
  )

  const highlighted = (
    <h5
      className={`text-scale-1200 text-xl font-normal ${minimalHeader ? 'text-base' : 'text-2xl'}`}
    >
      {highlightedValue}
      <span className="text-lg">{format}</span>
    </h5>
  )
  const label = <h5 className="text-scale-900 text-xs">{highlightedLabel}</h5>

  if (minimalHeader) {
    return (
      <div className="flex flex-row items-center gap-x-4" style={{ minHeight: '1.8rem' }}>
        {chartTitle}
        <div className="flex flex-row items-baseline gap-x-2">
          {highlightedValue && highlighted}
          {label}
        </div>
      </div>
    )
  }

  return (
    <div className="h-16">
      {chartTitle}
      {highlightedValue && highlighted}
      {label}
    </div>
  )
}

export default ChartHeader
