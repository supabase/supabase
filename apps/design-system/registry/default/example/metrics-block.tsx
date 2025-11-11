'use client'

import {
  MetricsBlock,
  MetricsBlockHeader,
  MetricsBlockIcon,
  MetricsBlockLabel,
} from 'ui-patterns/MetricsBlock'
import { ChartBar } from 'lucide-react'

export default function MetricsBlockDemo() {
  return (
    <MetricsBlock>
      <MetricsBlockHeader>
        <MetricsBlockIcon>
          <ChartBar />
        </MetricsBlockIcon>
        <MetricsBlockLabel>Metrics Block</MetricsBlockLabel>
      </MetricsBlockHeader>
    </MetricsBlock>
  )
}
