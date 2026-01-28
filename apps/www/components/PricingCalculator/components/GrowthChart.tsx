'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { cn } from 'ui'
import Panel from '~/components/Panel'
import type { ProjectionSeries } from '~/lib/pricing-calculator'
import { formatUsd } from './format'

type Props = {
  title: string
  subtitle?: string
  series: ProjectionSeries
  className?: string
}

export default function GrowthChart({ title, subtitle, series, className }: Props) {
  const data = series.points.map((p) => ({
    month: p.monthIndex,
    supabase: p.supabaseMonthlyUsd,
  }))

  return (
    <Panel outerClassName={cn('w-full', className)} innerClassName="p-5 md:p-6">
      <div className="flex flex-col gap-1 mb-4">
        <h3 className="text-foreground text-lg">{title}</h3>
        {subtitle && <p className="text-foreground-lighter text-sm">{subtitle}</p>}
      </div>

      <div className="w-full h-[260px] md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid stroke="hsl(var(--border-default))" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'hsl(var(--foreground-lighter))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border-default))' }}
              tickLine={{ stroke: 'hsl(var(--border-default))' }}
              label={{
                value: 'Month',
                position: 'insideBottom',
                offset: -5,
                fill: 'hsl(var(--foreground-lighter))',
              }}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--foreground-lighter))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border-default))' }}
              tickLine={{ stroke: 'hsl(var(--border-default))' }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--background-surface-100))',
                border: '1px solid hsl(var(--border-default))',
              }}
              labelFormatter={(label) => `Month ${label}`}
              formatter={(value: any, name: any) => [
                formatUsd(Number(value)),
                formatSeriesName(String(name)),
              ]}
            />
            <Legend
              verticalAlign="bottom"
              align="left"
              iconSize={8}
              wrapperStyle={{ paddingTop: 8, fontSize: 12, lineHeight: '16px' }}
              formatter={(value: any) => (
                <span className="text-foreground-lighter text-xs">
                  {formatSeriesName(String(value))}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="supabase"
              stroke="hsl(var(--brand-default))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

function formatSeriesName(key: string) {
  switch (key) {
    case 'supabase':
      return 'Supabase'
    default:
      return key
  }
}
