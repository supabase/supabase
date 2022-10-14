import { Tabs } from '@supabase/ui'
import { useState } from 'react'
import { Bar, BarChart, Legend, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import * as data from '~/data/blog/PostgresFTSComparison'

const barColors = {
  pg: 'var(--colors-brand11)',
  meilisearch: 'var(--colors-blue11)',
  typesense: 'var(--colors-violet11)',
  'sqlite-disk': 'var(--colors-orange11)',
  "sqlite-mem": 'var(--colors-yellow11)',
  opensearch: 'var(--colors-tomato11)',
}

const dimensions = ['pg', 'meilisearch', 'typesense', 'sqlite-disk', 'sqlite-mem', 'opensearch']

const renderColorfulLegendText = (value: string, entry: any) => {
  const { color } = entry

  return <span className='text-sm -mt-32' style={{ color }}>{value}</span>
}

const CustomizedAxisTick =(props:any) => {
  
    const { x, y, stroke, payload } = props

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={-12} dy={16} textAnchor="end" fill="var(--colors-scale10)" transform="rotate(-35)" className='text-xs'>
          {payload.value}
        </text>
      </g>
    )
  }



const Chart = () => {
  const [selection, setSelection] = useState('latency')
  return (
    <div className={'my-16 flex flex-col'}>
      <Tabs
        defaultActiveId={'latency'}
        type="underlined"
        size="medium"
        block
        onChange={(value: string) => setSelection(value)}
      >
        <Tabs.Panel id="latency" label="Latency"></Tabs.Panel>
        <Tabs.Panel id="results" label="Number of results"></Tabs.Panel>
        <Tabs.Panel id="avg_latency" label="Average latency"></Tabs.Panel>
      </Tabs>
      <ResponsiveContainer height={720} minHeight={720} width="100%">
        {/* // 
        @ts-ignore */}
        <BarChart data={data[selection]} layout="vertical">
          <XAxis
            axisLine={{ stroke: 'var(--colors-scale7)' }}
            tickLine={{ stroke: 'var(--colors-scale7)' }}
            type="number"
            tickMargin={8}
            style={{ fontSize: '14px', marginBottom: '32px', color: 'var(--colors-scale12)'}}
            tick={<CustomizedAxisTick />}
            label={{
              value: selection === 'latency' ? 'Latency (ms)' : selection  === 'avg_latency' ? 'Average latency (ms)' : 'Number of results',
              position: 'insideBottom',
              offset: -32,
              fill: 'var(--colors-scale12)',
            }}
          />
          <YAxis
            dataKey={'query'}
            type="category"
            style={{ fontSize: '14px', marginBottom: '32px', color: 'var(--colors-scale10)' }}
            minTickGap={16}
            tickMargin={8}
            axisLine={{ stroke: 'var(--colors-scale7)' }}
            tickLine={{ stroke: 'var(--colors-scale7)' }}
            tick={<CustomizedAxisTick />}
          />
          {dimensions.map((dimension: string, index: number) => {
            // @ts-ignore
            return <Bar dataKey={`${dimension}`} fill={barColors[dimension]} />
          })}
          <Legend
            verticalAlign="top"
            height={64}
            className={'mt-16'}
            iconSize={8}
            formatter={renderColorfulLegendText}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Chart
