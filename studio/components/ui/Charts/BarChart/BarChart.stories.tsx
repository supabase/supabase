import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { action } from '@storybook/addon-actions';
import { BarChart } from './BarChart'

export default {
  title: 'Charts/BarChart',
  component: BarChart,
} as ComponentMeta<typeof BarChart>

const Template: ComponentStory<typeof BarChart> = (args) => <BarChart {...args} />

const data = [290, 430, 620, 67, 354, 123, 627, 122].map(val => ({ "ram_usage": val}));

export const Default = Template.bind({})
const defaultArgs = {
  attribute: 'ram_usage',
  label: 'Memory usage',
  onBarClick: action('clicked'),
  className: 'ram-bar-chart',
  data : data,
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
  highlightedValue:  430,
}

export const withCustomDateFormat = Template.bind({})
withCustomDateFormat.args = {
  ...defaultArgs,
  customDateFormat: 'MMM D, YYYY',
}

export const withDisplayDateInUtc = Template.bind({})
withDisplayDateInUtc.args = {
  ...defaultArgs,
  displayDateInUtc: true,
}

export const withMinimalHeader = Template.bind({})
withMinimalHeader.args = {
  ...defaultArgs,
  minimalHeader: true,
}

export const withChartSizeSmall = Template.bind({})
withChartSizeSmall.args = {
  ...defaultArgs,
  chartSize: 'small',
}

export const withChartSizeTiny = Template.bind({})
withChartSizeTiny.args = {
  ...defaultArgs,
  chartSize: 'tiny',
}

export const withNoData = Template.bind({})
withNoData.args = {
  ...defaultArgs,
  noDataTitle: 'No data Found',
  noDataMessage: "This is strange, we're looking into it",
  data : []
}
