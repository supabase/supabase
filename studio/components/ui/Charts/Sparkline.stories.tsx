import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import dayjs from 'dayjs'
import Chart from './Sparkline'
import { StackedChartProps } from './Charts.types'
import { STACK_COLORS } from './Charts.constants'

export default {
  title: 'Charts/Sparkline',
} as ComponentMeta<typeof Chart>

const DATA = [290, 430, 649, 422, 321].flatMap((value, index) => [
  {
    count: value,
    level: 'error',
    timestamp: dayjs().subtract(index, 'day').toISOString(),
  },
])

const PROPS = {
  title: 'Memory usage',
  xAxisKey: 'timestamp',
  yAxisKey: 'count',
  data: DATA,
}
export const Sparkline = () => (
  <div className="flex flex-col gap-4 ">
    <ExampleName>Examples</ExampleName>
    <div className="flex flex-row gap-4 flex-wrap pb-10">
      {[
        { title: 'Small', props: { size: 'small' as const } },
        { title: 'Normal', props: {} },
        { title: 'Large', props: { size: 'large' as const } },
        { title: 'No data', props: { data: [] } },
      ].map(({ title, props }) => (
        <div className="w-32 h-72">
          <ExampleName>{title}</ExampleName>
          <div className="w-full h-full mt-4">
            <Chart {...PROPS} {...props} />
          </div>
        </div>
      ))}
    </div>
  </div>
)

const ExampleName: React.FC = ({ children }) => (
  <h1
    className="font-bold text-scale-
  1100"
  >
    {children}
  </h1>
)
