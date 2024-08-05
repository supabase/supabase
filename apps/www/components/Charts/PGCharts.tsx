import { Tabs } from 'ui'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Bar, BarChart, Legend, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import * as data from '~/data/blog/PostgresFTSComparison'

import remarkGfm from 'remark-gfm'

const barColors = {
  pg: 'hsl(var(--brand-600))',
  meilisearch: 'var(--colors-blue11)',
  typesense: 'var(--colors-violet11)',
  'sqlite-disk': 'var(--colors-orange11)',
  'sqlite-mem': 'var(--colors-yellow11)',
  opensearch: 'var(--colors-tomato11)',
}

const dimensions = ['pg', 'meilisearch', 'typesense', 'sqlite-disk', 'sqlite-mem', 'opensearch']

const renderColorfulLegendText = (value: string, entry: any) => {
  const { color } = entry

  return (
    <span className="text-sm -mt-32" style={{ color }}>
      {value}
    </span>
  )
}

const CustomizedAxisTick = (props: any) => {
  const { x, y, stroke, payload } = props

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={-12}
        dy={16}
        textAnchor="end"
        fill="hsl(var(--foreground-lighter))"
        transform="rotate(-35)"
        className="text-xs"
      >
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
        <Tabs.Panel id="raw_data" label="Raw data"></Tabs.Panel>
      </Tabs>

      {selection !== 'raw_data' ? (
        <ResponsiveContainer height={720} minHeight={720} width="100%">
          {/* //
        @ts-ignore */}
          <BarChart data={data[selection]} layout="vertical">
            <XAxis
              axisLine={{ stroke: 'hsl(var(--border-default))' }}
              tickLine={{ stroke: 'hsl(var(--border-default))' }}
              type="number"
              tickMargin={8}
              style={{
                fontSize: '14px',
                marginBottom: '32px',
                color: 'hsl(var(--foreground-default))',
              }}
              tick={<CustomizedAxisTick />}
              label={{
                value:
                  selection === 'latency'
                    ? 'Latency (ms)'
                    : selection === 'avg_latency'
                      ? 'Avg latency per result (ms)'
                      : 'Number of results',
                position: 'insideBottom',
                offset: -32,
                fill: 'hsl(var(--foreground-default))',
              }}
            />
            <YAxis
              dataKey={'query'}
              type="category"
              style={{
                fontSize: '14px',
                marginBottom: '32px',
                color: 'hsl(var(--foreground-lighter))',
              }}
              minTickGap={16}
              tickMargin={8}
              axisLine={{ stroke: 'hsl(var(--border-default))' }}
              tickLine={{ stroke: 'hsl(var(--border-default))' }}
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
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {`
| engine        | query        | number of results | latency (ms) | avg result latency (ms) |
|---------------|--------------|-------------------|--------------|-------------------------|
| \`pg\`          | "super hero" | \`34\`              | \`3.68\`       | \`0.108\`                 |
| \`pg\`          | "superhero"  | \`86\`              | \`1.59\`       | \`0.0184\`                |
| \`pg\`          | "superman"   | \`47\`              | \`1.24\`       | \`0.0264\`                |
| \`pg\`          | "suprman"    | \`0\`               | \`0.999\`      | \`Infinity\`              |
| \`pg\`          | "love"       | \`5417\`            | \`15.3\`       | \`0.00282\`               |
| \`pg\`          | "world war"  | \`834\`             | \`2.94\`       | \`0.00352\`               |
| \`pg\`          | "spy"        | \`349\`             | \`1.78\`       | \`0.00510\`               |
| \`pg\`          | "romance"    | \`630\`             | \`2.14\`       | \`0.00339\`               |
| \`pg\`          | "comedy"     | \`1213\`            | \`3.55\`       | \`0.00292\`               |
| \`pg\`          | "awakening"  | \`210\`             | \`1.93\`       | \`0.00919\`               |
| \`meilisearch\` | "super hero" | \`56\`              | \`4.82\`       | \`0.0861\`                |
| \`meilisearch\` | "superhero"  | \`14\`              | \`4.39\`       | \`0.313\`                 |
| \`meilisearch\` | "superman"   | \`41\`              | \`3.45\`       | \`0.0841\`                |
| \`meilisearch\` | "suprman"    | \`29\`              | \`2.69\`       | \`0.0929\`                |
| \`meilisearch\` | "love"       | \`812\`             | \`12.4\`       | \`0.0153\`                |
| \`meilisearch\` | "world war"  | \`316\`             | \`8.53\`       | \`0.0270\`                |
| \`meilisearch\` | "spy"        | \`47\`              | \`3.57\`       | \`0.0760\`                |
| \`meilisearch\` | "romance"    | \`35\`              | \`3.05\`       | \`0.0871\`                |
| \`meilisearch\` | "comedy"     | \`67\`              | \`3.46\`       | \`0.0516\`                |
| \`meilisearch\` | "awakening"  | \`15\`              | \`3.63\`       | \`0.242\`                 |
| \`typesense\`   | "super hero" | \`8\`               | \`3.99\`       | \`0.499\`                 |
| \`typesense\`   | "superhero"  | \`8\`               | \`2.09\`       | \`0.261\`                 |
| \`typesense\`   | "superman"   | \`28\`              | \`2.71\`       | \`0.0968\`                |
| \`typesense\`   | "suprman"    | \`28\`              | \`2.83\`       | \`0.101\`                 |
| \`typesense\`   | "love"       | \`745\`             | \`30.6\`       | \`0.0411\`                |
| \`typesense\`   | "world war"  | \`11\`              | \`3.26\`       | \`0.296\`                 |
| \`typesense\`   | "spy"        | \`47\`              | \`3.78\`       | \`0.0804\`                |
| \`typesense\`   | "romance"    | \`34\`              | \`2.68\`       | \`0.0789\`                |
| \`typesense\`   | "comedy"     | \`55\`              | \`3.14\`       | \`0.0571\`                |
| \`typesense\`   | "awakening"  | \`14\`              | \`2.07\`       | \`0.148\`                 |
| \`sqlite-disk\` | "super hero" | \`20\`              | \`0.682\`      | \`0.0341\`                |
| \`sqlite-disk\` | "superhero"  | \`67\`              | \`0.524\`      | \`0.00782\`               |
| \`sqlite-disk\` | "superman"   | \`47\`              | \`0.355\`      | \`0.00755\`               |
| \`sqlite-disk\` | "suprman"    | \`0\`               | \`0.0806\`     | \`Infinity\`              |
| \`sqlite-disk\` | "love"       | \`4691\`            | \`27.7\`       | \`0.00590\`               |
| \`sqlite-disk\` | "world war"  | \`781\`             | \`5.02\`       | \`0.00642\`               |
| \`sqlite-disk\` | "spy"        | \`241\`             | \`0.916\`      | \`0.00380\`               |
| \`sqlite-disk\` | "romance"    | \`554\`             | \`1.97\`       | \`0.00355\`               |
| \`sqlite-disk\` | "comedy"     | \`1220\`            | \`4.25\`       | \`0.00349\`               |
| \`sqlite-disk\` | "awakening"  | \`63\`              | \`0.303\`      | \`0.00482\`               |
| \`sqlite-mem\`  | "super hero" | \`20\`              | \`0.392\`      | \`0.0196\`                |
| \`sqlite-mem\`  | "superhero"  | \`67\`              | \`0.237\`      | \`0.00354\`               |
| \`sqlite-mem\`  | "superman"   | \`47\`              | \`0.193\`      | \`0.00410\`               |
| \`sqlite-mem\`  | "suprman"    | \`0\`               | \`0.0568\`     | \`Infinity\`              |
| \`sqlite-mem\`  | "love"       | \`4691\`            | \`13.4\`       | \`0.00286\`               |
| \`sqlite-mem\`  | "world war"  | \`781\`             | \`2.93\`       | \`0.00376\`               |
| \`sqlite-mem\`  | "spy"        | \`241\`             | \`0.644\`      | \`0.00267\`               |
| \`sqlite-mem\`  | "romance"    | \`554\`             | \`1.43\`       | \`0.00258\`               |
| \`sqlite-mem\`  | "comedy"     | \`1220\`            | \`2.91\`       | \`0.00239\`               |
| \`sqlite-mem\`  | "awakening"  | \`63\`              | \`0.237\`      | \`0.00377\`               |
| \`opensearch\`  | "super hero" | \`431\`             | \`112\`        | \`0.260\`                 |
| \`opensearch\`  | "superhero"  | \`45\`              | \`12.6\`       | \`0.281\`                 |
| \`opensearch\`  | "superman"   | \`25\`              | \`11.4\`       | \`0.454\`                 |
| \`opensearch\`  | "suprman"    | \`0\`               | \`6.78\`       | \`Infinity\`              |
| \`opensearch\`  | "love"       | \`3036\`            | \`139\`        | \`0.0457\`                |
| \`opensearch\`  | "world war"  | \`3805\`            | \`149\`        | \`0.0393\`                |
| \`opensearch\`  | "spy"        | \`168\`             | \`14.1\`       | \`0.0842\`                |
| \`opensearch\`  | "romance"    | \`383\`             | \`23.9\`       | \`0.0625\`                |
| \`opensearch\`  | "comedy"     | \`756\`             | \`40.1\`       | \`0.0531\`                |
| \`opensearch\`  | "awakening"  | \`32\`              | \`9.84\`       | \`0.307\`                 |`}
        </ReactMarkdown>
      )}
    </div>
  )
}

export default Chart
