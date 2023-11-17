import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import dayjs from 'dayjs'
import Chart from './StackedBarChart'
import { StackedChartProps } from './Charts.types'
import { DEFAULT_STACK_COLORS, genStackColorScales } from './Charts.constants'

export default {
  title: 'Charts/StackedBarChart',
} as ComponentMeta<typeof Chart>

const DATA = [290, 430, 649, 422, 321].flatMap((value, index) => [
  {
    count: value,
    level: 'error',
    timestamp: dayjs().subtract(index, 'day').toISOString(),
  },
  {
    count: value * 2,
    level: 'info',
    timestamp: dayjs().subtract(index, 'day').toISOString(),
  },
  {
    count: value * 1.3,
    level: 'warn',
    timestamp: dayjs().subtract(index, 'day').toISOString(),
  },
])

const PROPS = {
  title: 'Memory usage',
  xAxisKey: 'timestamp',
  yAxisKey: 'count',
  stackKey: 'level',
  data: DATA,
}
export const StackedBarChart = () => (
  <div className="flex flex-col gap-4 ">
    <ExampleName>Default Stacked Chart Colors</ExampleName>
    <div className="flex flex-row ">
      {genStackColorScales(DEFAULT_STACK_COLORS).map((c) => (
        <div className="w-10 h-10" key={c.base} style={{ background: c.base }}></div>
      ))}
    </div>

    <ExampleName>Examples</ExampleName>
    <div className="flex flex-row gap-4 flex-wrap pb-10">
      {[
        { title: 'Normal', props: {} },
        { title: 'No title', props: { title: undefined } },
        { title: 'Minimal Header', props: { minimalHeader: true } },
        { title: 'Hide Legend', props: { hideLegend: true } },
        { title: 'Hide header', props: { hideHeader: true } },
        { title: 'Percentage Bars', props: { variant: 'percentages' as const } },
        {
          title: 'Percentage Bars with suffix',
          props: { variant: 'percentages' as const, format: 'mem' },
        },
        {
          title: 'Formatter - Auto 2 Precision for floats',
          props: { data: DATA.map((d) => ({ ...d, count: d.count + 5.12 })) },
        },
        { title: 'UTC Dates', props: { displayDateInUtc: true } },
        { title: 'Custom date format', props: { customDateFormat: 'HH:mm' } },
        { title: 'Value format (c suffix)', props: { format: 'c' } },
        { title: 'Minimal Value format', props: { minimalHeader: true, format: 'c' } },
        { title: 'No data', props: { data: [] } },
      ].map(({ title, props }, i) => (
        <div key={i} className="w-72 h-72">
          <ExampleName>{title}</ExampleName>
          <div className="w-full h-full mt-4">
            <Chart {...PROPS} {...props} />
          </div>
        </div>
      ))}
    </div>
  </div>
)

const ExampleName: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h1 className="font-bold text-light">{children}</h1>
)
