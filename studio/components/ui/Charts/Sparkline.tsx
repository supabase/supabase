import { LineChart, XAxis, Line } from 'recharts'
import { CHART_COLORS } from './Charts.constants'
import { CommonChartProps } from './Charts.types'
import { useChartSize } from './Charts.utils'
interface Props extends CommonChartProps<any> {
  xAxisKey: string
  yAxisKey: string
}
const Sparkline: React.FC<Props> = ({ size, data, xAxisKey, yAxisKey }) => {
  const { Container } = useChartSize(size, {
    tiny: 30,
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
