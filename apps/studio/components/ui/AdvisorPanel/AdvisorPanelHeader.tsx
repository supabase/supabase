import dayjs from 'dayjs'
import { ChevronLeft, X } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { AdvisorItemSource, AdvisorSeverity } from 'state/advisor-state'
import { Badge } from 'ui'

export type AdvisorItem = {
  id: string
  title: string
  severity: AdvisorSeverity
  createdAt?: number
  tab: 'security' | 'performance' | 'messages'
  source: AdvisorItemSource
  original: any
}

export const severityBadgeVariants: Record<AdvisorSeverity, 'destructive' | 'warning' | 'default'> =
  {
    critical: 'destructive',
    warning: 'warning',
    info: 'default',
  }

export const severityLabels: Record<AdvisorSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

interface AdvisorPanelHeaderProps {
  selectedItem: AdvisorItem | undefined
  onBack: () => void
  onClose: () => void
}

export const AdvisorPanelHeader = ({ selectedItem, onBack, onClose }: AdvisorPanelHeaderProps) => {
  return (
    <div className="border-b px-4 py-3 flex items-center gap-3">
      <ButtonTooltip
        type="text"
        className="w-7 h-7 p-0 flex justify-center items-center"
        icon={<ChevronLeft size={16} strokeWidth={1.5} aria-hidden={true} />}
        onClick={onBack}
        tooltip={{ content: { side: 'bottom', text: 'Back to list' } }}
      />
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="heading-default">{selectedItem?.title?.replace(/[`\\]/g, '')}</span>
          {selectedItem?.createdAt && (
            <span className="text-xs text-foreground-light capitalize-sentence">
              {(() => {
                const insertedAt = selectedItem.createdAt
                const daysFromNow = dayjs().diff(dayjs(insertedAt), 'day')
                const formattedTimeFromNow = dayjs(insertedAt).fromNow()
                const formattedInsertedAt = dayjs(insertedAt).format('MMM DD, YYYY')
                return daysFromNow > 1 ? formattedInsertedAt : formattedTimeFromNow
              })()}
            </span>
          )}
        </div>
        {selectedItem && (
          <Badge variant={severityBadgeVariants[selectedItem.severity]}>
            {severityLabels[selectedItem.severity]}
          </Badge>
        )}
      </div>
      <ButtonTooltip
        type="text"
        className="w-7 h-7 p-0"
        icon={<X strokeWidth={1.5} />}
        onClick={onClose}
        tooltip={{ content: { side: 'bottom', text: 'Close Advisor Center' } }}
      />
    </div>
  )
}
