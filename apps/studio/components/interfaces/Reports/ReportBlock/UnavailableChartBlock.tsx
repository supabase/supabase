import { ReactNode } from 'react'

import { ReportBlockContainer } from './ReportBlockContainer'
import { InstanceHealthIcon } from '@/lib/constants/metrics'

interface UnavailableChartBlockProps {
  label: string
  actions?: ReactNode
}

export const UnavailableChartBlock = ({ label, actions }: UnavailableChartBlockProps) => {
  return (
    <ReportBlockContainer
      draggable
      showDragHandle
      loading={false}
      icon={<InstanceHealthIcon size={14} className="text-foreground-muted" />}
      label={label}
      actions={actions}
    >
      <div className="flex flex-1 flex-col justify-center gap-y-1 px-5 py-4">
        <p className="text-xs text-foreground-light">
          This chart isn't available on your current compute size
        </p>
        <p className="text-xs text-foreground-lighter">
          Your compute's disk IO runs at a sustained rate. There's no burst credit pool to track.
          You can remove this chart from your report.
        </p>
      </div>
    </ReportBlockContainer>
  )
}
