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

  return (
    <div className="px-24 w-full">
      <MetricsBlock>
        <MetricsBlockHeader hasLink href="https://www.supabase.io">
          <MetricsBlockLabel hasTooltip tooltip="This is a tooltip">
            Metrics Block
          </MetricsBlockLabel>
        </MetricsBlockHeader>
        <MetricsBlockContent>
          <MetricsBlockValue>5,201</MetricsBlockValue>
          <MetricsBlockDifferential variant="positive">+0.7%</MetricsBlockDifferential>
        </MetricsBlockContent>
        <MetricsBlockSparkline data={data} dataKey="value" />
      </MetricsBlock>
    </div>
  )
}
