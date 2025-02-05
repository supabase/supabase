'use client'

import dayjs from 'dayjs'
import { DateTimeFormats } from './Charts.constants'
import { numberFormatter } from './Charts.utils'
import { MultiAttribute } from './ComposedChartHandler'

interface CustomIconProps {
  color: string
}

const CustomIcon = ({ color }: CustomIconProps) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="5" r="3" fill={color} />
  </svg>
)

const MaxConnectionsIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="2" y1="6" x2="12" y2="6" stroke="#3ECF8E" strokeWidth="2" strokeDasharray="2 2" />
  </svg>
)

interface TooltipProps {
  active?: boolean
  payload?: any[]
  label?: string | number
  attributes?: MultiAttribute[]
  isPercentage?: boolean
  valuePrecision?: number
  showMaxValue?: boolean
}

const formatLargeNumber = (num: number, precision: number = 0) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(precision)}MiB`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(precision)}KiB`
  } else {
    return num.toString()
  }
}

const isMax = (attributes?: MultiAttribute[]) => attributes?.find((a) => a.isMaxValue)

const CustomTooltip = ({
  active,
  payload,
  attributes,
  isPercentage,
  valuePrecision,
}: TooltipProps) => {
  if (active && payload && payload.length) {
    const timestamp = payload[0].payload.timestamp
    const maxValueAttribute = isMax(attributes)
    const maxValueData =
      maxValueAttribute && payload?.find((p: any) => p.dataKey === maxValueAttribute.attribute)
    const maxValue = maxValueData?.value
    const isRamChart = payload?.some((p: any) => p.name.toLowerCase().includes('ram_'))
    const total = payload
      ?.filter((p) => p.dataKey !== maxValueAttribute?.attribute)
      .reduce((acc, curr) => acc + curr.value, 0)

    const getIcon = (name: string, color: string) => {
      switch (name.toLowerCase().includes('max')) {
        case false:
          return <CustomIcon color={color} />
        default:
          return <MaxConnectionsIcon />
      }
    }

    const LabelItem = ({ entry }: { entry: any }) => {
      const attribute = attributes?.find((a: MultiAttribute) => a.attribute === entry.name)
      const percentage = ((entry.value / maxValue) * 100).toFixed(1)
      const isMax = entry.dataKey === maxValueAttribute?.attribute

      return (
        <div key={entry.name} className="flex items-center w-full">
          {getIcon(entry.name, entry.color)}
          <span className="text-foreground-lighter ml-1 flex-grow">
            {attribute?.label || entry.name}
          </span>
          <span className="ml-3.5 flex items-end gap-1">
            {isRamChart
              ? formatLargeNumber(entry.value, valuePrecision)
              : numberFormatter(entry.value, valuePrecision)}
            {isPercentage ? '%' : ''}

            {/* Show percentage if max value is set */}
            {percentage && !isMax && (
              <span className="text-[11px] text-foreground-light mb-0.5">({percentage}%)</span>
            )}
          </span>
        </div>
      )
    }

    return (
      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg px-2.5 py-1.5 text-xs shadow-xl">
        <p className="font-medium">{dayjs(timestamp).format(DateTimeFormats.FULL_SECONDS)}</p>
        <div className="grid gap-0">
          {payload.reverse().map((entry: any) => (
            <LabelItem key={entry.name} entry={entry} />
          ))}
          {active && (
            <div className="flex md:flex-col gap-1 md:gap-0 text-foreground font-semibold">
              <span className="flex-grow text-foreground-lighter">Total</span>
              <div className="flex items-end gap-1">
                <span className="text-base">
                  {isRamChart ? formatLargeNumber(total, 1) : numberFormatter(total)}
                </span>
                {maxValueAttribute &&
                  !isNaN(total / maxValueData?.value) &&
                  isFinite(total / maxValueData?.value) && (
                    <span className="text-[11px] text-foreground-light mb-0.5">
                      ({((total / maxValueData?.value) * 100).toFixed(1)}%)
                    </span>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

const CustomLabel = ({ active, payload, label, attributes, showMaxValue }: TooltipProps) => {
  const items = payload ?? []
  const maxValueAttribute = isMax(attributes)
  const maxValueData =
    maxValueAttribute && payload?.find((p: any) => p.dataKey === maxValueAttribute.attribute)

  const getIcon = (name: string, color: string) => {
    console.log(name, maxValueAttribute)
    switch (name === maxValueAttribute?.attribute) {
      case true:
        return <MaxConnectionsIcon />
      default:
        return <CustomIcon color={color} />
    }
  }

  const LabelItem = ({ entry }: { entry: any }) => {
    const attribute = attributes?.find((a) => a.attribute === entry.name)

    // if (!showMaxValue) return null

    return (
      <p key={entry.name} className="inline-flex md:flex-col gap-1 md:gap-0 w-fit text-foreground">
        <div className="flex items-center gap-1">
          {getIcon(entry.name, entry.color)}
          <span className="text-nowrap text-foreground-lighter pr-2">
            {attribute?.label || entry.name}
          </span>
        </div>
        {/* <div className="ml-3.5 flex items-end gap-1">
          {active && (
            <span className="text-base">
              {isRamChart ? formatLargeNumber(entry.value, 1) : numberFormatter(entry.value)}
            </span>
          )}
          {active &&
            !entry.name.toLowerCase().includes('max') &&
            !isNaN(entry.value / maxConnections?.value) &&
            isFinite(entry.value / maxConnections?.value) && (
              <span className="text-[11px] text-foreground-light mb-0.5">
                ({numberFormatter((entry.value / maxConnections?.value) * 100)}%)
              </span>
            )}
        </div> */}
      </p>
    )
  }

  return (
    <div className="absolute left-0 right-0 mx-auto -bottom-4 top-auto flex flex-col items-center gap-1 text-xs w-full min-h-16">
      <div className="flex flex-col sm:flex-wrap justify-start sm:flex-row gap-0 md:gap-2">
        {items?.map((entry) => <LabelItem key={entry.name} entry={entry} />)}
        {/* {active && (
          <p className="flex sm:flex-col gap-1 sm:gap-0 text-foreground font-semibold">
            <span className="flex-grow text-foreground-lighter">Total</span>
            <div className="flex items-end gap-1">
              <span className="text-base">
                {isRamChart
                  ? formatLargeNumber(totalConnections, 1)
                  : numberFormatter(totalConnections)}
              </span>
              {!isNaN(totalConnections / maxConnections?.value) &&
                isFinite(totalConnections / maxConnections?.value) && (
                  <span className="text-[11px] text-foreground-light mb-0.5">
                    ({numberFormatter((totalConnections / maxConnections?.value) * 100)}%)
                  </span>
                )}
            </div>
          </p>
        )} */}
      </div>
      {/* {active && (
        <p className="text-foreground-lighter text-xs">
          {dayjs(label).format('DD MMM YYYY, HH:mm:ss')}
        </p>
      )} */}
    </div>
  )
}

export { CustomTooltip, CustomLabel }
