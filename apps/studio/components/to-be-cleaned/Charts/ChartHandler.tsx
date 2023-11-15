import { Dictionary } from 'components/grid'
import { isUndefined } from 'lodash'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'
import { Button, IconActivity, IconAlertCircle, IconBarChart, IconLoader } from 'ui'

import AreaChart from 'components/ui/Charts/AreaChart'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ChartData } from './ChartHandler.types'
import { BarChart } from './ChartRenderer'

interface ChartHandlerProps {
  label: string
  attribute: string
  provider: string
  startDate: string
  endDate: string
  interval: string
  customDateFormat?: string
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
const ChartHandler = ({
  label,
  attribute,
  provider,
  startDate,
  endDate,
  interval,
  customDateFormat,
  children = null,
  defaultChartStyle = 'bar',
  hideChartType = false,
  data,
  isLoading,
  format,
  highlightedValue,
  onBarClick,
}: PropsWithChildren<ChartHandlerProps>) => {
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
    : provider === 'daily-stats' && !attribute.includes('ingress') && !attribute.includes('egress')
    ? chartData?.maximum
    : provider === 'daily-stats'
    ? chartData?.total
    : provider === 'log-stats'
    ? chartData?.totalGrouped?.[attribute]
    : chartData?.data[chartData?.data.length - 1]?.[attribute]

  if (loading) {
    return (
      <div className="flex h-52 w-full flex-col items-center justify-center space-y-4">
        <IconLoader className="animate-spin text-border-strong" />
        <p className="text-xs text-foreground-lighter">Loading data for {label}</p>
      </div>
    )
  }

  if (isUndefined(chartData)) {
    return (
      <div className="flex h-52 w-full flex-col items-center justify-center space-y-4">
        <IconAlertCircle className="text-border-strong" />
        <p className="text-xs text-foreground-lighter">Unable to load data for {label}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <div className="absolute right-6 z-50 flex justify-between">
        <div className="space-y-3">{children}</div>
        {!hideChartType && (
          <div>
            <div className="flex w-full space-x-3">
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
          xAxisKey="period_start"
          yAxisKey={attribute}
          highlightedValue={highlightedValue}
          title={label}
          customDateFormat={customDateFormat}
        />
      )}
    </div>
  )
}

export default ChartHandler
