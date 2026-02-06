import type { SupportFormUrlKeys } from 'components/interfaces/Support/SupportForm.utils'
import type { HelpOptionId } from './helpOptionsConfig'
import { HelpOptionsList } from './HelpOptionsList'

type HelpSectionProps = {
  title: string
  description: string
  excludeIds?: HelpOptionId[]
  isPlatform: boolean
  projectRef: string | undefined
  supportLinkQueryParams: Partial<SupportFormUrlKeys> | undefined
  onAssistantClick?: () => void
  onSupportClick?: () => void
  /** Wrapper padding: 'none' for use inside already-padded containers (e.g. Help popover px-5), 'default' for p-4 (e.g. Feedback dropdown) */
  padding?: 'none' | 'default'
}

export const HelpSection = ({
  title,
  description,
  excludeIds = [],
  isPlatform,
  projectRef,
  supportLinkQueryParams,
  onAssistantClick,
  onSupportClick,
  padding = 'none',
}: HelpSectionProps) => {
  const wrapperClass = 'flex flex-col gap-4'
  const headingClass =
    padding === 'default' ? 'flex flex-col gap-1' : 'px-5 flex flex-col gap-1'
  const listWrapperClass = padding === 'default' ? '' : 'px-5'

  return (
    <div className={wrapperClass}>
      <div className={headingClass}>
        <h5 className="text-foreground">{title}</h5>
        <p className="text-sm text-foreground-lighter text-balance">{description}</p>
      </div>
      <div className={listWrapperClass}>
        <HelpOptionsList
          excludeIds={excludeIds}
          variant="button-group"
          isPlatform={isPlatform}
          projectRef={projectRef}
          supportLinkQueryParams={supportLinkQueryParams}
          onAssistantClick={onAssistantClick}
          onSupportClick={onSupportClick}
          size="tiny"
        />
      </div>
    </div>
  )
}
