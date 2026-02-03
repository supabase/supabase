'use client'

import dayjs from 'dayjs'
import { formatBytes } from 'lib/helpers'
import { useState } from 'react'
import { cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'
import { CHART_COLORS, DateTimeFormats } from './Charts.constants'
import { formatPercentage, numberFormatter } from './Charts.utils'

export interface ReportAttributes {
  id?: string
  titleTooltip?: string
  label: string
  attributes?: (MultiAttribute | false)[]
  defaultChartStyle?: 'bar' | 'line' | 'stackedAreaLine'
  hide?: boolean
  availableIn?: string[]
  hideChartType?: boolean
  format?: string
  className?: string
  showTooltip?: boolean
  showLegend?: boolean
  showTotal?: boolean
  showMaxValue?: boolean
  valuePrecision?: number
  docsUrl?: string
  syncId?: string
  showGrid?: boolean
  YAxisProps?: {
    width?: number
    tickFormatter?: (value: any) => string
  }
  hideHighlightedValue?: boolean
}

export type Provider = 'infra-monitoring' | 'daily-stats' | 'mock' | 'reference-line' | 'logs'

export type MultiAttribute = {
  attribute: string
  provider?: Provider
  label?: string
  color?: {
    light: string
    dark: string
  }
  fill?: {
    light?: string
    dark?: string
  }
  statusCode?: string
  grantType?: string
  providerType?: string
  stackId?: string
  format?: string
  description?: string
  docsLink?: string
  isMaxValue?: boolean
  type?: 'line' | 'area-bar'
  omitFromTotal?: boolean
  tooltip?: string
  customValue?: number
  [key: string]: any
  /**
   * Manipulate the value of the attribute before it is displayed on the chart.
   * @param value - The value of the attribute.
   * @returns The manipulated value.
   */
  manipulateValue?: (value: number) => number
  /**
   * Create a virtual attribute by combining values from other attributes.
   * Expression should use attribute names and basic math operators (+, -, *, /).
   * Example: 'disk_fs_used - pg_database_size - disk_fs_used_wal'
   */
  combine?: string
  id?: string
  value?: number
  isReferenceLine?: boolean
  strokeDasharray?: string
  className?: string
  hide?: boolean
  enabled?: boolean
}

interface CustomIconProps {
  color: string
}

const CustomIcon = ({ color }: CustomIconProps) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="5" r="3" fill={color} />
  </svg>
)

const MaxConnectionsIcon = ({ color }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line
      x1="2"
      y1="6"
      x2="12"
      y2="6"
      stroke={color ?? CHART_COLORS.REFERENCE_LINE}
      strokeWidth="2"
      strokeDasharray="2 2"
    />
  </svg>
)

interface TooltipProps {
  active?: boolean
  payload?: any[]
  label?: string | number
  attributes?: MultiAttribute[]
  isPercentage?: boolean
  format?: string | ((value: unknown) => string)
  valuePrecision?: number
  showMaxValue?: boolean
  showTotal?: boolean
  isActiveHoveredChart?: boolean
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

export const CustomTooltip = ({
  active,
  payload,
  label,
  attributes,
  isPercentage,
  format,
  valuePrecision,
  showTotal,
  isActiveHoveredChart,
}: TooltipProps) => {
  if (active && payload && payload.length) {
    /**
     * Depending on the data source, the timestamp key could be 'timestamp' or 'period_start'
     */
    const firstItem = payload[0].payload
    const timestampKey = firstItem?.hasOwnProperty('timestamp') ? 'timestamp' : 'period_start'
    const timestamp = payload[0].payload[timestampKey]
    const maxValueAttribute = isMaxAttribute(attributes)
    const maxValueData =
      maxValueAttribute && payload?.find((p: any) => p.dataKey === maxValueAttribute.attribute)
    const maxValue = maxValueData?.value
    const isRamChart =
      !payload?.some((p: any) => p.dataKey.toLowerCase() === 'ram_usage') &&
      payload?.some((p: any) => p.dataKey.toLowerCase().includes('ram_'))
    const isDBSizeChart =
      payload?.some((p: any) => p.dataKey.toLowerCase().includes('disk_fs_')) ||
      payload?.some((p: any) => p.dataKey.toLowerCase().includes('pg_database_size'))
    const isNetworkChart = payload?.some((p: any) => p.dataKey.toLowerCase().includes('network_'))
    const isBytesFormat = format === 'bytes' || format === 'bytes-per-second'
    const shouldFormatBytes = isBytesFormat || isRamChart || isDBSizeChart || isNetworkChart
    const byteUnitSuffix = format === 'bytes-per-second' ? '/s' : ''

    const attributesToIgnore =
      attributes?.filter((a) => a.omitFromTotal)?.map((a) => a.attribute) ?? []
    const referenceLines =
      attributes
        ?.filter((attribute: MultiAttribute) => attribute?.provider === 'reference-line')
        ?.map((a: MultiAttribute) => a.attribute) ?? []

    const attributesToIgnoreFromTotal = [
      ...attributesToIgnore,
      ...referenceLines,
      ...(maxValueAttribute?.attribute ? [maxValueAttribute.attribute] : []),
    ]

    const localTimeZone = dayjs.tz.guess()

    const total = showTotal && calculateTotalChartAggregate(payload, attributesToIgnoreFromTotal)

    const getIcon = (color: string, isMax: boolean) =>
      isMax ? <MaxConnectionsIcon /> : <CustomIcon color={color} />

    const formatNumeric = (value: number) => {
      if (!shouldFormatBytes && valuePrecision === 0 && value > 0 && value < 1) return '<1'
      return shouldFormatBytes
        ? formatBytes(isNetworkChart ? Math.abs(value) : value, valuePrecision)
        : numberFormatter(value, valuePrecision)
    }

    const LabelItem = ({ entry }: { entry: any }) => {
      const attribute = attributes?.find((a: MultiAttribute) => a?.attribute === entry.name)
      const percentage = ((entry.value / maxValue) * 100).toFixed(valuePrecision)
      const isMax = entry.dataKey === maxValueAttribute?.attribute

      return (
        <div key={entry.name} className="flex items-center w-full">
          {getIcon(entry.color, isMax)}
          <span className="text-foreground-lighter ml-1 flex-grow cursor-default select-none">
            {attribute?.label || entry.name}
          </span>
          <span className="ml-3.5 flex items-end gap-1">
            {formatNumeric(entry.value) + (!isPercentage && format !== 'ms' ? byteUnitSuffix : '')}
            {isPercentage ? '%' : ''}
            {format === 'ms' ? 'ms' : ''}

            {/* Show percentage if max value is set */}
            {!!maxValueData && !isMax && !isPercentage && (
              <span className="text-[11px] text-foreground-light mb-0.5">({percentage}%)</span>
            )}
          </span>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg px-2.5 py-1.5 text-xs shadow-xl transition-opacity opacity-100',
          !isActiveHoveredChart && 'opacity-0'
        )}
      >
        <p className="text-foreground-light text-xs">{localTimeZone}</p>
        <p className="font-medium">{dayjs(timestamp).format(DateTimeFormats.FULL_SECONDS)}</p>
        <div className="grid gap-0">
          {payload.reverse().map((entry: any, index: number) => (
            <LabelItem key={`${entry.name}-${index}`} entry={entry} />
          ))}
          {active && showTotal && (
            <div className="flex md:flex-col gap-1 md:gap-0 text-foreground mt-1">
              <span className="flex-grow text-foreground-lighter">Total</span>
              <div className="flex items-end gap-1">
                <span className="text-base">
                  {isPercentage
                    ? formatPercentage(total as number, valuePrecision)
                    : formatNumeric(total as number) +
                      (!isPercentage && format !== 'ms' ? byteUnitSuffix : '')}
                  {format === 'ms' ? 'ms' : ''}
                </span>
                {maxValueAttribute &&
                  !isPercentage &&
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
  onToggleAttribute?: (attribute: string, options?: { exclusive?: boolean }) => void
  hiddenAttributes?: Set<string>
}

export const CustomLabel = ({
  payload,
  attributes,
  showMaxValue,
  onLabelHover,
  onToggleAttribute,
  hiddenAttributes,
}: CustomLabelProps) => {
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
    const isHidden = hiddenAttributes?.has(entry.name)
    const color = isHidden ? 'gray' : entry.color

    const Label = () => (
      <div className="flex items-center gap-1">
        {getIcon(entry.name, color)}
        <span className={cn('text-nowrap text-foreground-lighter', isHidden && 'opacity-50')}>
          {attribute?.label || entry.name}
        </span>
      </div>
    )

    if (!showMaxValue && isMax) return null

    return (
      <button
        key={entry.name}
        className="flex md:flex-col gap-1 md:gap-0 w-fit text-foreground rounded-lg  hover:bg-background-overlay-hover"
        onMouseOver={() => handleMouseEnter(entry.name)}
        onMouseOutCapture={handleMouseLeave}
        onClick={(e) => onToggleAttribute?.(entry.name, { exclusive: e.metaKey || e.ctrlKey })}
      >
        {!!attribute?.tooltip ? (
          <Tooltip>
            <TooltipTrigger className="p-1.5">
              <Label />
            </TooltipTrigger>
            <TooltipContent sideOffset={6} side="bottom" align="center" className="max-w-[250px]">
              {attribute.tooltip}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Label />
        )}
      </button>
    )
  }

  return (
    <div className="relative z-10 mx-auto flex flex-col items-center gap-1 text-xs w-full">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <TooltipProvider delayDuration={800}>
          {items?.map((entry, index) => <LabelItem key={`${entry.name}-${index}`} entry={entry} />)}
        </TooltipProvider>
      </div>
    </div>
  )
}
