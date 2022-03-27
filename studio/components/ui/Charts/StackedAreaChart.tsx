import dayjs from 'dayjs'
import { useMemo } from 'react'
import {
  AreaChart,
  XAxis,
  YAxis,
  Area,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaProps,
} from 'recharts'
import EmptyState from './EmptyState'

type Datum = {
  [key: string]: any
}

type Data = Datum[]
interface Props {
  data?: Data
  isLoading: boolean
  xAxisKey: string
  xAxisFormatAsDate?: boolean
  dateFormat?: string
  yAxisKey: string
  stackKey: string
  size?: 'small' | 'normal' | 'large'
  styleMap: {
    [key: string]: Pick<AreaProps, 'fill' | 'stroke'>
  }
}

const StackedAreaChart: React.FC<Props> = ({
  data,
  xAxisKey,
  dateFormat,
  yAxisKey,
  stackKey,
  isLoading,
  size = 'normal',
  styleMap = {},
  xAxisFormatAsDate = false,
}) => {
  if (!isLoading && (data === undefined || data === null)) return <EmptyState />
  const transformed = useMemo(() => {
    if (!data) return []
    const mapping = data.reduce((acc, datum) => {
      const x = datum[xAxisKey]
      const y = datum[yAxisKey]
      const s = datum[stackKey]
      if (!acc[x]) {
        acc[x] = {}
      }
      acc[x][s] = y
      return acc
    }, {})

    const flattened = Object.entries(mapping).map(([x, sMap]) => ({
      ...(sMap as Datum),
      [xAxisKey]: x,
    }))
    return flattened
  }, [JSON.stringify(data)])
  const dataKeys = Object.keys(transformed[0] || {}).filter((k) => k !== xAxisKey && k !== yAxisKey)

  const formatToDate = (value: string | number | any) => {
    if (!dateFormat) return value
    if (!isNaN(Number(value))) {
      const unix = String(value).length > 10 ? Number(String(value).slice(0, 10)) : value
      return dayjs.unix(unix).format(dateFormat)
    } else {
      return dayjs(value).format(dateFormat)
    }
  }
  const minHeight = { small: 120, normal: 160, large: 280 }[size]
  return (
    <ResponsiveContainer height={minHeight} minHeight={minHeight} width="100%">
      <AreaChart data={transformed} onClick={(_tooltipData: any) => {}}>
        <CartesianGrid strokeDasharray="3 3" style={{ stroke: '#444444' }} />
        <XAxis
          dataKey={xAxisKey}
          angle={0}
          axisLine={{ stroke: '#444444' }}
          tickLine={{ stroke: '#444444' }}
          tickFormatter={xAxisFormatAsDate ? formatToDate : undefined}
          tickMargin={12}
          interval="preserveStartEnd"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          style={{ fontSize: '12px' }}
          minTickGap={10}
          axisLine={{ stroke: '#444444' }}
          tickLine={{ stroke: '#444444' }}
        />
        {dataKeys.map((k, index) => (
          <Area
            key={index}
            dataKey={String(k)}
            type="monotone"
            legendType="circle"
            fill={'rgba(62, 207, 142, 0.2)'}
            stroke="#4884d8"
            connectNulls
            stackId={1}
            {...(styleMap[k] || {})}
          />
        ))}
        <Tooltip
          labelFormatter={xAxisFormatAsDate ? formatToDate : undefined}
          labelClassName="text-white"
          contentStyle={{ backgroundColor: '#444444', borderColor: '#444444', fontSize: '12px' }}
          wrapperClassName="bg-gray-600"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default StackedAreaChart
