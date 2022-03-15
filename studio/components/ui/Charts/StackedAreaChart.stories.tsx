import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import StackedAreaChart from './StackedAreaChart'

export default {
  title: 'Charts/StackedAreaChart',
  component: StackedAreaChart,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'fullscreen',
  },
} as ComponentMeta<typeof StackedAreaChart>

const Template: ComponentStory<typeof StackedAreaChart> = (args) => <StackedAreaChart {...args} />

export const Default = Template.bind({})
Default.args = {
  data: [
  ]
}
