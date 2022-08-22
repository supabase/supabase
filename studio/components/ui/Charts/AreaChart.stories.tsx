import React from 'react'
import { ComponentMeta } from '@storybook/react'
import Chart from './AreaChart'
import dayjs from 'dayjs'

export default {
  title: 'Charts',
} as ComponentMeta<typeof Chart>

const DATA = [290, 430, 649, 422, 321, 893, 111].map((value, index) => ({
  ram_usage: value,
  timestamp: dayjs().subtract(index, 'day').toISOString(),
}))

export const AreaChart = () => (
  <div className="flex flex-row gap-4 flex-wrap">
    <div className="w-72">
      <ExampleName>Normal</ExampleName>
      <Chart title="Memory usage" xAxisKey="timestamp" yAxisKey="ram_usage" data={DATA} />
    </div>
    <div className="w-72">
      <ExampleName>No title prop</ExampleName>
      <Chart xAxisKey="timestamp" yAxisKey="ram_usage" data={DATA} />
    </div>
  </div>
)

const ExampleName: React.FC = ({ children }) => (
  <h1 className="font-bold text-scale-1100">{children}</h1>
)
