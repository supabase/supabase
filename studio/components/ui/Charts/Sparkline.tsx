import { useState } from 'react'
import { LineChart, Bar, XAxis, Tooltip, Legend, Cell, TooltipProps, Line } from 'recharts'
import ChartHeader from './ChartHeader'
import { CHART_COLORS, STACK_COLORS, DateTimeFormats } from './Charts.constants'
import { CommonChartProps } from './Charts.types'
import { timestampFormatter, useChartSize, useStacked } from './Charts.utils'
import { precisionFormatter } from './Charts.utils'
import NoDataPlaceholder from './NoDataPlaceholder'
interface Props extends CommonChartProps<any> {
  xAxisKey: string
  yAxisKey: string
}
const Sparkline: React.FC<Props> = ({ size, data, xAxisKey, yAxisKey }) => {
  const { Container } = useChartSize(size, {
    small: 50,
    normal: 90,
    large: 140,
  })
  if (data.length === 0) return null
  return (
    <Container>
      <LineChart
        data={data}
        margin={{
          top: 2,
          right: 10,
          left: 10,
          bottom: 2,
        }}
        className="overflow-visible max-w-sm"
      >
        <XAxis hide dataKey={xAxisKey} />
        <Line
          type="monotone"
          dataKey={yAxisKey}
          stroke={CHART_COLORS.GREEN_1}
          dot={false}
          animationDuration={600}
          strokeWidth={1.5}
        />
      </LineChart>
    </Container>
  )
}

export default Sparkline
