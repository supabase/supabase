import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import AreaChart from './AreaChart'

export default {
  title: 'Charts/AreaChart',
  component: AreaChart,
} as ComponentMeta<typeof AreaChart>

const Template: ComponentStory<typeof AreaChart> = (args) => <AreaChart {...args} />

const data = [290, 430, 649, 422, 321, 893, 111].map(value => ({ram_usage : value}))

export const Default = Template.bind({})
const defaultArgs = {
  attribute: 'ram_usage',
  label: 'Memory usage',
  data,  
}
Default.args = {...defaultArgs}


export const withYAxisLimit = Template.bind({})
withYAxisLimit.args = {
  ...defaultArgs,
  yAxisLimit: 'dataMax + 1000',
}

export const withFormat = Template.bind({})
withFormat.args = {
  ...defaultArgs,
  format: '%',
}

export const withHighlightedValue = Template.bind({})
withHighlightedValue.args = {
  ...defaultArgs,
  highlightedValue: 430,
}

export const withCustomDateFormat = Template.bind({})
withCustomDateFormat.args = {
  ...defaultArgs,
  customDateFormat: 'MMM D, YYYY',
}
