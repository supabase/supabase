import React, { FC, ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { isUndefined } from 'lodash'
import {
  Button,
  IconActivity,
  IconAlertCircle,
  IconBarChart,
  IconLoader,
  Typography,
} from '@supabase/ui'
import { Dictionary } from '@supabase/grid'

import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import { BarChart, AreaChart } from './ChartRenderer'
import { ChartData } from './ChartHandler.types'
import { TooltipProps } from 'recharts'

interface Props {
  label: string
  attribute: string
  provider: string
  startDate: string
  endDate: string
  interval: string
  customDateFormat?: string
  children?: ReactNode
  highlight?: 'total' | 'average' | 'maximum'
  defaultChartStyle?: 'bar' | 'line'
  hideChartType?: boolean
  data?: ChartData
  isLoading?: boolean
  format?: string
  highlightedValue?: string | number
  onBarClick?: (v: any) => void
}

/**
 * Controls chart display state. Optionally fetches static chart data if data is not provided.
 *
 * If the `data` prop is provided, it will disable automatic chart data fetching and pass the data directly to the chart render.
 * - loading state can also be provided through the `isLoading` prop, to display loading placeholders. Ignored if `data` key not provided.
 * - if `isLoading=true` and `data` is `undefined`, loading error message will be shown.
 *
 * Provided data must be in the expected chart format.
 */
const ChartHandler: FC<Props> = ({
  label,
  attribute,
  provider,
  startDate,
  endDate,
  interval,
  customDateFormat,
  children = null,
  highlight,
  defaultChartStyle = 'bar',
  hideChartType = false,
  data,
  isLoading,
  format,
  highlightedValue,
  onBarClick,
}) => {
  const router = useRouter()
  const { ref } = router.query

  // internal state is overridden by isLoading prop
  const [fetching, setFetching] = useState<boolean>(false)
  const [fetchedData, setFetchedData] = useState<any>(undefined)
  const [chartStyle, setChartStyle] = useState<string>(defaultChartStyle)
  const chartData = data || fetchedData
  const loading = isLoading || fetching

  useEffect(() => {
    let cancel = false

    const fetchChartData = async () => {
      setFetching(true)

      const url = `${API_URL}/projects/${ref}/${provider}?attribute=${attribute}&startDate=${encodeURIComponent(
        startDate
      )}&endDate=${encodeURIComponent(endDate)}&interval=${interval ? interval : '1d'}`

      const { error, ...res } = await get(url)

      if ((error || isUndefined(res)) && !cancel) {
        setFetching(false)
        setFetchedData(undefined)
        return console.error('Chart error:', error)
      }

      // Convert null values to 0
      // TODO: Chart endpoint should handle this data formatting to 0 instead of client.
      const formattedChartData = (res?.data ?? []).map(
        (dataPoint: Dictionary<any>, idx: number) => {
          return {
            ...dataPoint,
            [attribute]: dataPoint[attribute] ? Number(dataPoint[attribute]) : 0,
          }
        }
      )

      if (!cancel) {
        setFetchedData({ ...res, data: formattedChartData })
        setFetching(false)
      }
    }

    // only fetch if data prop is not provided
    if (data === undefined && !isLoading) {
      fetchChartData()
    }

    return () => {
      cancel = true
    }
  }, [startDate])

  highlightedValue = highlightedValue
    ? highlightedValue
    : provider === 'daily-stats'
    ? chartData?.total
    : provider === 'log-stats'
    ? chartData?.totalGrouped?.[attribute]
    : chartData?.totalAverage

  if (loading) {
    return (
      <div className="w-full h-52 flex flex-col space-y-4 items-center justify-center">
        <IconLoader className="animate-spin text-scale-700" />
        <p className="text-xs text-scale-900">Loading data for {label}</p>
      </div>
    )
  }

  if (isUndefined(chartData)) {
    console.log('i am undefined chart data')
    return (
      <div className="w-full h-52 flex flex-col space-y-4 items-center justify-center">
        <IconAlertCircle className="text-scale-700" />
        <p className="text-scale-900 text-xs">Unable to load data for {label}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between absolute right-6 z-50">
        <div className="space-y-3">{children}</div>
        {!hideChartType && (
          <div>
            <div className="flex space-x-3 w-full">
              <Button
                type="default"
                icon={chartStyle === 'bar' ? <IconActivity /> : <IconBarChart />}
                onClick={() => setChartStyle(chartStyle === 'bar' ? 'line' : 'bar')}
              />
            </div>
          </div>
        )}
      </div>
      {chartStyle === 'bar' ? (
        <BarChart
          data={chartData?.data ?? []}
          attribute={attribute}
          yAxisLimit={chartData?.yAxisLimit}
          format={format || chartData?.format}
          highlightedValue={highlightedValue}
          label={label}
          customDateFormat={customDateFormat}
          onBarClick={onBarClick}
        />
      ) : (
        <AreaChart
          data={chartData?.data ?? []}
          format={format || chartData?.format}
          attribute={attribute}
          yAxisLimit={chartData?.yAxisLimit}
          highlightedValue={highlightedValue}
          label={label}
          customDateFormat={customDateFormat}
        />
      )}
    </div>
  )
}

export default ChartHandler
