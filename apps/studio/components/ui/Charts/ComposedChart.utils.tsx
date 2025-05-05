'use client'

import dayjs from 'dayjs'
import { useState } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
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

const isMaxAttribute = (attributes?: MultiAttribute[]) => attributes?.find((a) => a.isMaxValue)

/**
 * Calculate the total aggregate of the chart values
 * by summing the values of the attributes
 * that are not in the `ignoreAttributes` array
 */
export const calculateTotalChartAggregate = (
  payload: { dataKey: string; value: number }[],
  ignoreAttributes?: string[]
) =>
  payload
    ?.filter((p) => !ignoreAttributes?.includes(p.dataKey))
    .reduce((acc, curr) => acc + curr.value, 0)

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
    const maxValueAttribute = isMaxAttribute(attributes)
    const maxValueData =
      maxValueAttribute && payload?.find((p: any) => p.dataKey === maxValueAttribute.attribute)
    const maxValue = maxValueData?.value
    const isRamChart = payload?.some((p: any) => p.dataKey.toLowerCase().includes('ram_'))
    const total =
      showTotal &&
      calculateTotalChartAggregate(
        payload,
        maxValueAttribute?.attribute ? [maxValueAttribute.attribute] : []
      )

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
              ? formatBytes(entry.value, valuePrecision)
              : numberFormatter(entry.value, valuePrecision)}
            {isPercentage ? '%' : ''}

            {/* Show percentage if max value is set */}
            {!!maxValueData && !isMax && (
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
          {payload.reverse().map((entry: any, index: number) => (
            <LabelItem key={`${entry.name}-${index}`} entry={entry} />
          ))}
          {active && showTotal && (
            <div className="flex md:flex-col gap-1 md:gap-0 text-foreground font-semibold">
              <span className="flex-grow text-foreground-lighter">Total</span>
              <div className="flex items-end gap-1">
                <span className="text-base">
                  {isRamChart ? formatBytes(total as number, 1) : numberFormatter(total as number)}
                  {isPercentage ? '%' : ''}
                </span>
                {maxValueAttribute &&
                  !isNaN((total as number) / maxValueData?.value) &&
                  isFinite((total as number) / maxValueData?.value) && (
                    <span className="text-[11px] text-foreground-light mb-0.5">
                      ({(((total as number) / maxValueData?.value) * 100).toFixed(1)}%)
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

interface CustomLabelProps {
  payload?: any[]
  attributes?: MultiAttribute[]
  showMaxValue?: boolean
  onLabelHover?: (label: string | null) => void
}

const CustomLabel = ({ payload, attributes, showMaxValue, onLabelHover }: CustomLabelProps) => {
  const items = payload ?? []
  const maxValueAttribute = isMaxAttribute(attributes)
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)

  const handleMouseEnter = (label: string) => {
    setHoveredLabel(label)
    onLabelHover?.(label)
  }

  const handleMouseLeave = () => {
    setHoveredLabel(null)
    onLabelHover?.(null)
  }

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
    const isHovered = hoveredLabel === entry.name

    const Label = () => (
      <div className="flex items-center gap-1">
        {getIcon(entry.name, entry.color)}
        <span
          className={cn(
            'text-nowrap text-foreground-lighter pr-2',
            hoveredLabel && !isHovered && 'opacity-50'
          )}
        >
          {attribute?.label || entry.name}
        </span>
      </div>
    )

    if (!showMaxValue && isMax) return null

    return (
      <div
        key={entry.name}
        className="inline-flex md:flex-col gap-1 md:gap-0 w-fit text-foreground"
        onMouseEnter={() => handleMouseEnter(entry.name)}
        onMouseOutCapture={handleMouseLeave}
      >
        {!!attribute?.tooltip ? (
          <Tooltip>
            <TooltipTrigger>
              <Label />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" className="max-w-[250px]">
              {attribute.tooltip}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Label />
        )}
      </div>
    )
  }

  return (
    <div className="relative z-0 mx-auto flex flex-col items-center gap-1 text-xs w-full">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {items?.map((entry, index) => <LabelItem key={`${entry.name}-${index}`} entry={entry} />)}
      </div>
    </div>
  )
}

export { CustomLabel, CustomTooltip }
