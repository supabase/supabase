import { AreaChart, XAxis, YAxis, Area, Tooltip, ResponsiveContainer } from 'recharts'
interface Props {
  label: string
  customDateFormat: string
  data: any[]
  isLoading: boolean
}

const StackedAreaChart: React.FC<Props> = () => (
  <ResponsiveContainer>
    <AreaChart
      width={730}
      height={250}
      data={[
        {
          day: '05-01',
          temperature: [-1, 10],
        },
        {
          day: '05-02',
          temperature: [2, 15],
        },
      ]}
      margin={{
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      }}
    >
      <XAxis dataKey="day" />
      <YAxis />
      <Area dataKey="temperature" stroke="#8884d8" fill="#8884d8" />
      <Tooltip />
    </AreaChart>
  </ResponsiveContainer>
)

export default StackedAreaChart
