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
  showTotal?: boolean
}

export const formatBytes = (bytes: number, precision: number = 1) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(precision)} ${sizes[i]}`
}

const formatLargeNumber = (num: number, precision: number = 0) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(precision)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(precision)}K`
  } else {
    return num.toString()
  }
}

export const isMax = (attributes?: MultiAttribute[]) => attributes?.find((a) => a.isMaxValue)

const CustomTooltip = ({
  active,
  payload,
  attributes,
  isPercentage,
  valuePrecision,
  showTotal,
}: TooltipProps) => {
  if (active && payload && payload.length) {
    const timestamp = payload[0].payload.timestamp
    const maxValueAttribute = isMax(attributes)
    const maxValueData =
      maxValueAttribute && payload?.find((p: any) => p.dataKey === maxValueAttribute.attribute)
    const maxValue = maxValueData?.value
    const isRamChart = payload?.some((p: any) => p.dataKey.toLowerCase().includes('ram_'))
    const total =
      showTotal &&
      payload
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
            {/* Show percentage if max value is set */}
            {!!maxValueData && !isMax && (
              <span className="text-[11px] text-foreground-light">({percentage}%)</span>
            )}
            {isRamChart
              ? formatBytes(entry.value, valuePrecision)
              : numberFormatter(entry.value, valuePrecision)}
            {isPercentage ? '%' : ''}
          </span>
        </div>
      )
    }

    return (
      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg px-2.5 py-1.5 text-xs shadow-xl">
        <p className="font-medium">{dayjs(timestamp).format(DateTimeFormats.FULL_SECONDS)}</p>
        <div className="grid">
          {payload.reverse().map((entry: any) => (
            <LabelItem key={entry.name} entry={entry} />
          ))}
          {active && showTotal && (
            <div className="flex gap-1 border-t mt-0.5 pt-0.5 text-foreground items-center">
              <span className="flex-grow text-foreground-lighter text-xs">Total</span>
              <div className="flex items-end gap-1 font-semibold">
                {maxValueAttribute &&
                  !isNaN(total / maxValueData?.value) &&
                  isFinite(total / maxValueData?.value) && (
                    <span className="text-[11px] text-foreground-light mb-0.5">
                      ({((total / maxValueData?.value) * 100).toFixed(1)}%)
                    </span>
                  )}
                <span className="text-base">
                  {isRamChart ? formatBytes(total, 1) : numberFormatter(total)}
                  {isPercentage ? '%' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

interface CustomLabelProps {
  payload?: any[]
  attributes?: MultiAttribute[]
  showMaxValue?: boolean
}

const CustomLabel = ({ payload, attributes, showMaxValue }: CustomLabelProps) => {
  const items = payload ?? []
  const maxValueAttribute = isMax(attributes)

  const getIcon = (name: string, color: string) => {
    switch (name === maxValueAttribute?.attribute) {
      case true:
        return <MaxConnectionsIcon />
      default:
        return <CustomIcon color={color} />
    }
  }

  const LabelItem = ({ entry }: { entry: any }) => {
    const attribute = attributes?.find((a) => a.attribute === entry.name)
    const isMax = entry.name === maxValueAttribute?.attribute

    if (!showMaxValue && isMax) return null

    return (
      <p key={entry.name} className="inline-flex md:flex-col gap-1 md:gap-0 w-fit text-foreground">
        <div className="flex items-center gap-1">
          {getIcon(entry.name, entry.color)}
          <span className="text-nowrap text-foreground-lighter pr-2">
            {attribute?.label || entry.name}
          </span>
        </div>
      </p>
    )
  }

  return (
    <div className="relative z-0 mx-auto flex flex-col items-center gap-1 text-xs w-full">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {items?.map((entry) => <LabelItem key={entry.name} entry={entry} />)}
      </div>
    </div>
  )
}

export { CustomTooltip, CustomLabel }
