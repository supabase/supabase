import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import StackedAreaChart from './StackedAreaChart'

export default {
  title: 'Charts/StackedAreaChart',
  component: StackedAreaChart,
} as ComponentMeta<typeof StackedAreaChart>

const Template: ComponentStory<typeof StackedAreaChart> = (args) => <StackedAreaChart {...args} />

export const Default = Template.bind({})
Default.args = {
  stackKey: 'status_code',
  xAxisKey: 'timestamp',
  yAxisKey: 'count',
  isLoading: false,
  xAxisFormatAsDate: true,
  size: 'large',
  dateFormat: 'MMM D, ha',

  data: [
    { count: 18, status_code: 200, timestamp: 1647864000000000 },
    { count: 1, status_code: 303, timestamp: 1647864000000000 },
    { count: 4, status_code: 201, timestamp: 1647864000000000 },
    { count: 18, status_code: 200, timestamp: 1647860000000000 },
    { count: 1, status_code: 303, timestamp: 1647860000000000 },
    { count: 4, status_code: 201, timestamp: 1647864000000000 },
  ],
}
