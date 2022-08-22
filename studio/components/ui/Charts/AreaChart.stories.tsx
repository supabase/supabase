import React from 'react'
import { ComponentMeta } from '@storybook/react'
import Chart from './AreaChart'
import dayjs from 'dayjs'
import Divider from '../Divider'

export default {
  title: 'Charts',
} as ComponentMeta<typeof Chart>

const DATA = [290, 430, 649, 422, 321, 893, 111].map((value, index) => ({
  ram_usage: value,
  timestamp: dayjs().subtract(index, 'day').toISOString(),
}))

export const AreaChart = () => (
  <div className="flex flex-col gap-4">
    <ExampleName>Normal</ExampleName>
    <Chart title="Memory usage" xAxisKey="timestamp" yAxisKey="ram_usage" data={DATA} />
    <Divider light={false} />
    <ExampleName>No title prop</ExampleName>
    <Chart xAxisKey="timestamp" yAxisKey="ram_usage" data={DATA} />
  </div>
)

const ExampleName: React.FC = ({ children }) => (
  <h1 className="font-bold text-scale-1100">{children}</h1>
)
