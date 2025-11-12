'use client'

import {
  MetricsBlock,
  MetricsBlockHeader,
  // MetricsBlockIcon,
  MetricsBlockLabel,
  MetricsBlockContent,
  MetricsBlockValue,
  MetricsBlockDifferential,
} from 'ui-patterns/MetricsBlock'
// import { ChartBar } from 'lucide-react'

export default function MetricsBlockDemo() {
  return (
    <div className="px-24 w-full">
      <MetricsBlock>
        <MetricsBlockHeader hasLink href="https://www.supabase.io">
          {/* <MetricsBlockIcon>
            <ChartBar size={14} strokeWidth={1.5} />
          </MetricsBlockIcon> */}
          <MetricsBlockLabel hasTooltip tooltip="This is a tooltip">
            Metrics Block
          </MetricsBlockLabel>
        </MetricsBlockHeader>
        <MetricsBlockContent>
          <MetricsBlockValue>5,201</MetricsBlockValue>
          <MetricsBlockDifferential>+0.7%</MetricsBlockDifferential>
        </MetricsBlockContent>
      </MetricsBlock>
    </div>
  )
}
