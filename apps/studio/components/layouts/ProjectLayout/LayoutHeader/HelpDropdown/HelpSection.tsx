import type { SupportFormUrlKeys } from 'components/interfaces/Support/SupportForm.utils'
import { cn } from 'ui'

import type { HelpOptionId } from './HelpDropdown.constants'
import { HelpOptionsList } from './HelpOptionsList'

type HelpSectionProps = {
  excludeIds?: HelpOptionId[]
  isPlatform: boolean
  projectRef: string | undefined
  supportLinkQueryParams: Partial<SupportFormUrlKeys> | undefined
  onAssistantClick?: () => void
  onSupportClick?: () => void
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
  const description = projectRef
    ? 'Start with our Assistant, docs, or community.'
    : 'Start with our docs or community.'

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-0.5">
        <h5 className="text-foreground">Need help with your project?</h5>
        <p className="text-xs text-foreground-lighter text-balance">{description}</p>
      </div>
      <HelpOptionsList
        excludeIds={excludeIds}
        isPlatform={isPlatform}
        projectRef={projectRef}
        supportLinkQueryParams={supportLinkQueryParams}
        onAssistantClick={onAssistantClick}
        onSupportClick={onSupportClick}
        size="tiny"
      />
    </div>
  )
}
