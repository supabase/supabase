import { cn } from 'ui'

import { HelpOptionsList } from './HelpOptionsList'
import type { HelpOptionId } from './HelpPanel.constants'
import type { SupportFormUrlKeys } from '@/components/interfaces/Support/SupportForm.utils'

type HelpSectionProps = {
  excludeIds?: HelpOptionId[]
  isPlatform: boolean
  projectRef: string | undefined
  supportLinkQueryParams: Partial<SupportFormUrlKeys> | undefined
  onAssistantClick?: () => void
  onSupportClick?: () => boolean | void
  className?: string
}

export const HelpSection = ({
  excludeIds = [],
  isPlatform,
  projectRef,
  supportLinkQueryParams,
  onAssistantClick,
  onSupportClick,
  className,
}: HelpSectionProps) => {
  return (
    <div className={cn('flex flex-col', className)}>
      <HelpOptionsList
        excludeIds={excludeIds}
        isPlatform={isPlatform}
        projectRef={projectRef}
        supportLinkQueryParams={supportLinkQueryParams}
        onAssistantClick={onAssistantClick}
        onSupportClick={onSupportClick}
      />
    </div>
  )
}
