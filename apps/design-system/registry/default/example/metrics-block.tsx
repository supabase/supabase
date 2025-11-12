'use client'

import {
  MetricsBlock,
  MetricsBlockHeader,
  MetricsBlockLabel,
  MetricsBlockContent,
  MetricsBlockValue,
  MetricsBlockDifferential,
  MetricsBlockSparkline,
} from 'ui-patterns/MetricsBlock'

export default function MetricsBlockDemo() {
  const data = Array.from({ length: 12 }, (_, i) => ({
    value: Math.floor(4000 + i * 100 + (Math.random() * 2000 - 800)),
    timestamp: new Date().toISOString(),
  }))

  const averageValue = data.reduce((acc, curr) => acc + curr.value, 0) / data.length

  const diff = data[data.length - 1].value - data[0].value
  const diffPercentage = (diff / averageValue) * 100

  return (
    <div className="w-full grid grid-cols-2 gap-5">
      <div className="w-full">
        <MetricsBlock>
          <MetricsBlockHeader hasLink href="https://www.supabase.io">
            <MetricsBlockLabel hasTooltip tooltip="This is a tooltip">
              Metrics Block
            </MetricsBlockLabel>
          </MetricsBlockHeader>
          <MetricsBlockContent>
            <MetricsBlockValue>{averageValue.toFixed(2).toLocaleString()}</MetricsBlockValue>
            <MetricsBlockDifferential variant="positive">
              {diffPercentage.toFixed(1)}%
            </MetricsBlockDifferential>
          </MetricsBlockContent>
          <MetricsBlockSparkline data={data} dataKey="value" />
        </MetricsBlock>
      </div>
      <div className="w-full">
        <MetricsBlock>
          <MetricsBlockHeader hasLink={false}>
            <MetricsBlockLabel hasTooltip={false}>Metrics Block</MetricsBlockLabel>
          </MetricsBlockHeader>
          <MetricsBlockContent orientation="horizontal">
            <MetricsBlockValue>{averageValue.toFixed(2).toLocaleString()}</MetricsBlockValue>
            <MetricsBlockDifferential variant="positive">
              {diffPercentage.toFixed(1)}%
            </MetricsBlockDifferential>
          </MetricsBlockContent>
          <MetricsBlockSparkline data={data} dataKey="value" />
        </MetricsBlock>
      </div>
      <div className="w-full">
        <MetricsBlock>
          <MetricsBlockHeader hasLink href="https://www.supabase.io">
            <MetricsBlockLabel hasTooltip tooltip="Something here">
              Metrics Block
            </MetricsBlockLabel>
          </MetricsBlockHeader>
          <MetricsBlockContent>
            <MetricsBlockValue>{averageValue.toFixed(2).toLocaleString()}</MetricsBlockValue>
            <MetricsBlockDifferential variant="positive">
              {diffPercentage.toFixed(1)}%
            </MetricsBlockDifferential>
          </MetricsBlockContent>
        </MetricsBlock>
      </div>
      <div className="w-full">
        <MetricsBlock>
          <MetricsBlockHeader hasLink={false}>
            <MetricsBlockLabel hasTooltip={false}>Metrics Block</MetricsBlockLabel>
          </MetricsBlockHeader>
          <MetricsBlockContent orientation="horizontal">
            <MetricsBlockValue>{averageValue.toFixed(2).toLocaleString()}</MetricsBlockValue>
            <MetricsBlockDifferential variant="positive">
              {diffPercentage.toFixed(1)}%
            </MetricsBlockDifferential>
          </MetricsBlockContent>
        </MetricsBlock>
      </div>
    </div>
  )
}
