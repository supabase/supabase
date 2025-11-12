'use client'

import {
  MetricsBlock,
  MetricsBlockHeader,
  MetricsBlockLabel,
  MetricsBlockContent,
  MetricsBlockValue,
  MetricsBlockDifferential,
} from 'ui-patterns/MetricsBlock'

export default function MetricsBlockDemo() {
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
      </MetricsBlock>
    </div>
  )
}
