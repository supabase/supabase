import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { action } from '@storybook/addon-actions';
import { BarChart } from './BarChart'

export default {
  title: 'Charts/BarChart',
  component: BarChart,
} as ComponentMeta<typeof BarChart>

const Template: ComponentStory<typeof BarChart> = (args) => <BarChart {...args} />


const data = [{
    "ram_usage": 290,
  },{
    "ram_usage": 430,
  },{
    "ram_usage": 620,
  },{
    "ram_usage": 20,
  },{
    "ram_usage": 40,
  },{
    "ram_usage": 630,
  },{
    "ram_usage": 200,
  },{
    "ram_usage": 140,
  },{
    "ram_usage": 360,
  },{
    "ram_usage": 240,
  },{
    "ram_usage": 400,
  },{
    "ram_usage": 60,
  },{
    "ram_usage": 20,
  },{
    "ram_usage": 40,
  },{
    "ram_usage": 60,
  },{
    "ram_usage": 20,
  },{
    "ram_usage": 40,
  },{
    "ram_usage": 60,
  },{
    "ram_usage": 20,
  },{
    "ram_usage": 40,
  },{
    "ram_usage": 60,
  },]

export const Default = Template.bind({})
Default.args = {
  attribute: 'ram_usage',
  label: 'Memory usage',
  onBarClick: action('clicked'),
  className: 'ram-bar-chart',
  data : data,
}

export const withYAxisLimit = Template.bind({})
withYAxisLimit.args = {
  attribute: 'ram_usage',
  yAxisLimit: 'dataMax + 1000',
  label: 'Memory usage',
  onBarClick: action('clicked'),
  className: 'ram-bar-chart',
  data : data,
}

export const withFormat = Template.bind({})
withFormat.args = {
  attribute: 'ram_usage',
  format: '%',
  label: 'Memory usage',
  onBarClick: action('clicked'),
  className: 'ram-bar-chart',
  data : data
}

export const withHighlightedValue = Template.bind({})
withHighlightedValue.args = {
  attribute: 'ram_usage',
  highlightedValue:  430,
  label: 'Memory usage',
  onBarClick: action('clicked'),
  className: 'ram-bar-chart',
  data : data
}

export const withCustomDateFormat = Template.bind({})
withCustomDateFormat.args = {
  attribute: 'ram_usage',
  customDateFormat: 'MMM D, YYYY',
  label: 'Memory usage',
  onBarClick: action('clicked'),
  className: 'ram-bar-chart',
  data : data
}

export const withDisplayDateInUtc = Template.bind({})
withDisplayDateInUtc.args = {
  attribute: 'ram_usage',
  displayDateInUtc: true,
  label: 'Memory usage',
  onBarClick: action('clicked'),
  className: 'ram-bar-chart',
  data : data
}

export const withMinimalHeader = Template.bind({})
withMinimalHeader.args = {
  attribute: 'ram_usage',
  label: 'Memory usage',
  onBarClick: action('clicked'),
  minimalHeader: true,
  className: 'ram-bar-chart',
  data : data
}

export const withChartSizeSmall = Template.bind({})
withChartSizeSmall.args = {
  attribute: 'ram_usage',
  displayDateInUtc: true,
  label: 'Memory usage',
  onBarClick: action('clicked'),
  chartSize: 'small',
  className: 'ram-bar-chart',
  data : data
}

export const withChartSizeTiny = Template.bind({})
withChartSizeTiny.args = {
  attribute: 'ram_usage',
  displayDateInUtc: true,
  label: 'Memory usage',
  onBarClick: action('clicked'),
  chartSize: 'tiny',
  className: 'ram-bar-chart',
  data : data
}

export const withNoData = Template.bind({})
withNoData.args = {
  attribute: 'ram_usage',
  displayDateInUtc: true,
  label: 'Memory usage',
  onBarClick: action('clicked'),
  className: 'ram-bar-chart',
  noDataTitle: 'No data Found',
  noDataMessage: "This is strange, we're looking into it",
  data : []
}