import Sparkline from 'components/ui/Charts/Sparkline'
import React from 'react'

interface Props {
  value: string | number
  startingValue?: string | number
  prefix?: string
  suffix?: string
  valueFormatter?: (value: Props['value']) => string
  sparklineData?: any
  sparklineXAxis?: string
  sparklineYAxis?: string
}

const Statistic: React.FC<Props> = ({
  prefix,
  suffix,
  value,
  startingValue,
  sparklineData,
  sparklineXAxis,
  sparklineYAxis,
}) => {
  const isNumber = typeof value === 'number' && !Number.isNaN(value)
  const percentageChange =
    startingValue && isNumber ? Number(startingValue) / Number(value) - 1 : null
  const showSparkline = sparklineData && sparklineXAxis && sparklineYAxis
  return (
    <div className="w-full">
      <div className="flex flex-row justify-center">
        <span>{prefix}</span>
        <span className="text-3xl text-foreground">{value}</span>
        <span>{suffix}</span>
      </div>
      {startingValue && (
        <div>
          {isNumber && percentageChange !== null && (
            <span>
              {Number(percentageChange * 100).toFixed(1)}
              {percentageChange > 0 ? 'increase' : 'decrease'}
            </span>
          )}
        </div>
      )}
      {showSparkline && (
        <Sparkline
          data={sparklineData}
          xAxisKey={sparklineXAxis}
          yAxisKey={sparklineYAxis}
          size="small"
        />
      )}
    </div>
  )
}

export default Statistic
