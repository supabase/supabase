import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { ChevronLeft, X } from 'lucide-react'
import { Badge } from 'ui'

import type { AdvisorItem } from './AdvisorPanel.types'
import {
  formatItemDate,
  getAdvisorItemDisplayTitle,
  severityBadgeVariants,
  severityLabels,
} from './AdvisorPanel.utils'

interface AdvisorPanelHeaderProps {
  selectedItem: AdvisorItem | undefined
  onBack: () => void
  onClose: () => void
}

export const AdvisorPanelHeader = ({ selectedItem, onBack, onClose }: AdvisorPanelHeaderProps) => {
  const displayTitle = selectedItem ? getAdvisorItemDisplayTitle(selectedItem) : undefined

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
          <span className="heading-default">{displayTitle}</span>
          {selectedItem?.createdAt && (
            <span className="text-xs text-foreground-light capitalize-sentence">
              {formatItemDate(selectedItem.createdAt)}
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
