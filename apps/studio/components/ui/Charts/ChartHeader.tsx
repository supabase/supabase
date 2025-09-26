import dayjs from 'dayjs'
import {
  Activity,
  BarChartIcon,
  GitCommitHorizontalIcon,
  InfoIcon,
  SquareTerminal,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { formatBytes } from 'lib/helpers'
import { numberFormatter } from './Charts.utils'
import { useChartHoverState } from './useChartHoverState'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

export interface ChartHeaderProps {
  title?: string
  format?: string | ((value: unknown) => string)
  customDateFormat?: string
  minimalHeader?: boolean
  displayDateInUtc?: boolean
  highlightedLabel?: number | string | any | null
  highlightedValue?: number | string | any | null
  hideHighlightedValue?: boolean
  hideChartType?: boolean
  chartStyle?: string
  onChartStyleChange?: (style: string) => void
  showMaxValue?: boolean
  setShowMaxValue?: (value: boolean) => void
  docsUrl?: string
  syncId?: string
  data?: any[]
  xAxisKey?: string
  yAxisKey?: string
  xAxisIsDate?: boolean
  valuePrecision?: number
  shouldFormatBytes?: boolean
  isNetworkChart?: boolean
  attributes?: any[]
  sql?: string
  titleTooltip?: string
}

export const ChartHeader = ({
  format,
  highlightedValue,
  highlightedLabel,
  hideHighlightedValue = false,
  title,
  minimalHeader = false,
  hideChartType = false,
  chartStyle = 'bar',
  onChartStyleChange,
  showMaxValue = false,
  setShowMaxValue,
  docsUrl,
  syncId,
  data,
  xAxisKey,
  yAxisKey,
  xAxisIsDate = true,
  displayDateInUtc,
  customDateFormat,
  valuePrecision = 2,
  shouldFormatBytes = false,
  isNetworkChart = false,
  attributes,
  sql,
  titleTooltip,
}: ChartHeaderProps) => {
  const { hoveredIndex, isHovered, isCurrentChart, setHover, clearHover } = useChartHoverState(
    syncId || 'default'
  )
  const [localHighlightedValue, setLocalHighlightedValue] = useState(highlightedValue)
  const [localHighlightedLabel, setLocalHighlightedLabel] = useState(highlightedLabel)
  const { ref } = useParams()
  const router = useRouter()

  const formatHighlightedValue = (value: any) => {
    if (typeof value !== 'number') {
      return value
    }

    if (typeof format === 'function') {
      return format(value)
    }

    if (shouldFormatBytes) {
      const bytesValue = isNetworkChart ? Math.abs(value) : value
      return formatBytes(bytesValue, valuePrecision)
    }

    return numberFormatter(value, valuePrecision)
  }

  useEffect(() => {
    if (syncId && hoveredIndex !== null && isHovered && data && xAxisKey && yAxisKey) {
      const activeDataPoint = data[hoveredIndex]
      if (activeDataPoint) {
        // For stacked charts, we need to calculate the total of all attributes
        // that should be included in the total (excluding reference lines, max values, etc.)
        let newValue = activeDataPoint[yAxisKey]

        // If this is a stacked chart with multiple attributes, calculate the total
        if (attributes && attributes.length > 1) {
          const attributesToIgnore =
            attributes
              ?.filter((a) => a.omitFromTotal || a.isMaxValue || a.provider === 'reference-line')
              ?.map((a) => a.attribute) ?? []

          const totalValue = Object.entries(activeDataPoint)
            .filter(([key, value]) => {
              // Include only numeric values that are not in the ignore list
              return (
                typeof value === 'number' &&
                key !== 'timestamp' &&
                key !== 'period_start' &&
                !attributesToIgnore.includes(key) &&
                attributes.some((attr) => attr.attribute === key && attr.enabled !== false)
              )
            })
            .reduce((sum, [_, value]) => sum + (value as number), 0)

          newValue = totalValue
        }

        setLocalHighlightedValue(newValue)

        // Update highlighted label based on sync state
        let newLabel = highlightedLabel
        if (xAxisIsDate && activeDataPoint[xAxisKey]) {
          const day = (value: number | string) =>
            displayDateInUtc ? dayjs(value).utc() : dayjs(value)
          newLabel = day(activeDataPoint[xAxisKey]).format(
            customDateFormat || 'YYYY-MM-DD HH:mm:ss'
          )
        } else if (activeDataPoint[xAxisKey]) {
          newLabel = activeDataPoint[xAxisKey]
        }
        setLocalHighlightedLabel(newLabel)
      }
    } else {
      // Reset to original values when not syncing
      setLocalHighlightedValue(highlightedValue)
      setLocalHighlightedLabel(highlightedLabel)
    }
  }, [
    hoveredIndex,
    isHovered,
    syncId,
    data,
    xAxisKey,
    yAxisKey,
    xAxisIsDate,
    displayDateInUtc,
    customDateFormat,
    highlightedValue,
    highlightedLabel,
    attributes,
  ])

  const chartTitle = (
    <div className="flex flex-row items-center gap-x-2">
      <div className="flex flex-row items-center gap-x-2">
        <h3 className={'text-foreground-lighter ' + (minimalHeader ? 'text-xs' : 'text-sm')}>
          {title}
        </h3>
        {titleTooltip && <InfoTooltip>{titleTooltip}</InfoTooltip>}
      </div>
      {docsUrl && (
        <ButtonTooltip
          type="text"
          className="px-1"
          asChild
          tooltip={{
            content: {
              side: 'top',
              text: 'Read docs',
            },
          }}
        >
          <Link href={docsUrl} target="_blank">
            <InfoIcon className="w-4 h-4 text-foreground-lighter" />
          </Link>
        </ButtonTooltip>
      )}
    </div>
  )

  const highlighted = (
    <h4
      className={`text-foreground text-xl font-normal ${minimalHeader ? 'text-base' : 'text-2xl'}`}
    >
      {localHighlightedValue !== undefined && formatHighlightedValue(localHighlightedValue)}
    </h4>
  )
  const label = <h4 className="text-foreground-lighter text-xs">{localHighlightedLabel}</h4>

  if (minimalHeader) {
    return (
      <div className="flex flex-row items-center gap-x-4" style={{ minHeight: '1.8rem' }}>
        {title && chartTitle}
        <div className="flex flex-row items-baseline gap-x-2">
          {highlightedValue !== undefined && !hideHighlightedValue && highlighted}
          {label}
        </div>
      </div>
    )
  }

  const hasHighlightedValue = highlightedValue !== undefined && !hideHighlightedValue

  return (
    <div className="flex-grow flex justify-between items-start min-h-16">
      <div className="flex flex-col">
        {title && chartTitle}
        <div className="h-4">
          {hasHighlightedValue && highlighted}
          {label}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {sql ? (
          <ButtonTooltip
            type="default"
            className="px-1.5"
            asChild
            tooltip={{
              content: {
                side: 'top',
                text: 'Open in Log Explorer',
              },
            }}
          >
            <Link href={`/project/${ref}/logs/explorer?q=${encodeURIComponent(sql)}`}>
              <SquareTerminal className="w-4 h-4 text-foreground-lighter" />
            </Link>
          </ButtonTooltip>
        ) : null}

        {!hideChartType && onChartStyleChange && (
          <ButtonTooltip
            type="default"
            className="px-1.5"
            icon={chartStyle === 'bar' ? <Activity /> : <BarChartIcon />}
            onClick={() => onChartStyleChange(chartStyle === 'bar' ? 'line' : 'bar')}
            tooltip={{
              content: {
                side: 'top',
                text: `View as ${chartStyle === 'bar' ? 'line chart' : 'bar chart'}`,
              },
            }}
          />
        )}
        {setShowMaxValue && (
          <ButtonTooltip
            type={showMaxValue ? 'default' : 'dashed'}
            className="px-1.5"
            icon={
              <GitCommitHorizontalIcon
                className={showMaxValue ? 'text-foreground-light' : 'text-foreground-lighter'}
              />
            }
            onClick={() => setShowMaxValue(!showMaxValue)}
            tooltip={{
              content: {
                side: 'top',
                text: `${showMaxValue ? 'Hide' : 'Show'} limit`,
              },
            }}
          />
        )}
      </div>
    </div>
  )
}
