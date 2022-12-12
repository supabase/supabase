import React from 'react'

interface Props {
  value: string | number
  startingValue?: string | number
  prefix?: string
  suffix?: string
  valueFormatter?: (value: Props['value']) => string
}

const Statistic: React.FC<Props> = ({ prefix, suffix, value, startingValue }) => {
  const isNumber = typeof value === 'number' && !Number.isNaN(value)
  const percentageChange =
    startingValue && isNumber ? Number(startingValue) / Number(value) - 1 : null
  return (
    <div className="w-full">
      <div className="flex flex-row justify-center">
        <span>{prefix}</span>
        <span className="text-3xl text-scale-1200">{value}</span>
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
    </div>
  )
}

export default Statistic
