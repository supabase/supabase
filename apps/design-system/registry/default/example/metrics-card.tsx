'use client'

import { useEffect, useState } from 'react'
import {
  MetricsCard,
  MetricsCardHeader,
  MetricsCardLabel,
  MetricsCardContent,
  MetricsCardValue,
  MetricsCardDifferential,
  MetricsCardSparkline,
} from 'ui-patterns/MetricsCard'

export default function MetricsCardDemo() {
  const [data, setData] = useState<Array<{ value: number; timestamp: string }>>([])

  useEffect(() => {
    setData(
      Array.from({ length: 12 }, (_, i) => ({
        value: Math.floor(4000 + i * 100 + (Math.random() * 2000 - 800)),
        timestamp: new Date().toISOString(),
      }))
    )
  }, [])

  const averageValue = data.reduce((acc, curr) => acc + curr.value, 0) / data.length

  const diff = data[data.length - 1]?.value - data[0]?.value
  const diffPercentage = (diff / averageValue) * 100

  return (
    <div className="w-1/2">
      <MetricsCard isLoading={!data.length}>
        <MetricsCardHeader hasLink href="https://www.supabase.io">
          <MetricsCardLabel hasTooltip tooltip="The number of Active Users over the last 24 hours">
            Active Users
          </MetricsCardLabel>
        </MetricsCardHeader>
        <MetricsCardContent>
          <MetricsCardValue>
            {averageValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </MetricsCardValue>
          <MetricsCardDifferential variant={diffPercentage > 0 ? 'positive' : 'negative'}>
            {diffPercentage > 0 ? '+' : '-'}
            {diffPercentage.toFixed(1)}%
          </MetricsCardDifferential>
        </MetricsCardContent>
        <MetricsCardSparkline data={data} dataKey="value" />
      </MetricsCard>
    </div>
  )
}
