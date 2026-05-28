import { HeartIcon } from 'lucide-react'
import { ReactNode } from 'react'

import { ReportBlockContainer } from './ReportBlockContainer'

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
      icon={<HeartIcon size={14} className="text-foreground-muted" />}
      label={label}
      actions={actions}
    >
      <div className="flex flex-1 flex-col justify-center gap-y-1 px-5 py-4">
        <p className="text-xs text-foreground-light">
          This chart isn't available on your current compute size
        </p>
        <p className="text-xs text-foreground-lighter">
          Disk IO burst balance only applies to compute sizes below 4XL. Larger instances have
          sustained disk IO at their baseline, so there's no burst credit pool to track. You can
          remove this chart from your report.
        </p>
      </div>
    </ReportBlockContainer>
  )
}
