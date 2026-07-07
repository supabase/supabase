import { ChevronLeft, X } from 'lucide-react'
import { Badge } from 'ui'
import { TimestampInfo } from 'ui-patterns'

import type { AdvisorItem } from './AdvisorPanel.types'
import {
  formatItemDate,
  getAdvisorItemSecondaryText,
  getAdvisorPanelItemDisplayTitle,
  severityBadgeVariants,
  severityLabels,
} from './AdvisorPanel.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface AdvisorPanelHeaderProps {
  selectedItem: AdvisorItem | undefined
  onBack: () => void
  onClose: () => void
}

export const AdvisorPanelHeader = ({ selectedItem, onBack, onClose }: AdvisorPanelHeaderProps) => {
  const displayTitle = selectedItem ? getAdvisorPanelItemDisplayTitle(selectedItem) : undefined
  const secondaryText = selectedItem ? getAdvisorItemSecondaryText(selectedItem) : undefined
  const createdAt = selectedItem?.createdAt

  const metadataCapitalize = selectedItem !== undefined && secondaryText === undefined

  return (
    <div className="border-b px-4 py-3 flex items-center gap-3">
      <ButtonTooltip
        variant="text"
        className="w-7 h-7 p-0 flex justify-center items-center"
        icon={<ChevronLeft size={16} strokeWidth={1.5} aria-hidden={true} />}
        onClick={onBack}
        tooltip={{ content: { side: 'bottom', text: 'Back to list' } }}
      />
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <div className="flex-1 flex flex-col">
          <span className="heading-default">{displayTitle}</span>
          {selectedItem?.source !== 'notification' && secondaryText ? (
            <span
              className={`text-xs text-foreground-light${metadataCapitalize ? ' capitalize-sentence' : ''}`}
            >
              {secondaryText}
            </span>
          ) : createdAt ? (
            <TimestampInfo
              className="w-fit capitalize-sentence"
              utcTimestamp={createdAt}
              label={formatItemDate(createdAt)}
            />
          ) : null}
        </div>
        {selectedItem && (
          <Badge variant={severityBadgeVariants[selectedItem.severity]}>
            {severityLabels[selectedItem.severity]}
          </Badge>
        )}
      </div>
      <ButtonTooltip
        variant="text"
        className="w-7 h-7 p-0"
        icon={<X strokeWidth={1.5} />}
        onClick={onClose}
        tooltip={{ content: { side: 'bottom', text: 'Close Advisor Center' } }}
      />
    </div>
  )
}
