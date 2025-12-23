import dayjs from 'dayjs'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { PageSection } from 'ui-patterns/PageSection'
import { UpgradeStepsTable } from '../UpgradeStepsTable'
import { UPGRADE_STATE_CONTENT, UpgradingStateProps } from '../types'

export const UpgradingState = ({
  projectRef,
  projectName,
  displayTargetVersion,
  progress,
  initiatedAt,
}: UpgradingStateProps) => {
  const content = UPGRADE_STATE_CONTENT.upgrading

  const initiatedAtUTC = dayjs.utc(initiatedAt ?? 0).format('DD MMM YYYY HH:mm:ss')
  const initiatedAtLocal = dayjs
    .utc(initiatedAt ?? 0)
    .local()
    .format('DD MMM YYYY HH:mm:ss (ZZ)')

  return (
    // TODO: this is basically the same as the BackingUpState component, so we should refactor it to be a shared component
    <PageSection>
      {/* Steps table */}
      <div className="flex flex-col gap-y-3">
        <h3 className="text-lg">{content.stepsHeading}</h3>
        <UpgradeStepsTable variant="upgrading" progress={progress} />
        {/* Upgrade metadata */}
        {initiatedAt !== undefined && (
          <p className="text-sm text-foreground-lighter">
            Upgrade began at{' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline decoration-dotted underline-offset-2 decoration-foreground-muted cursor-help">
                  {initiatedAtUTC} (UTC)
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-center">
                {initiatedAtLocal}
              </TooltipContent>
            </Tooltip>
          </p>
        )}
      </div>
    </PageSection>
  )
}
