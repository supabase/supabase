import dayjs from 'dayjs'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { PageSection } from 'ui-patterns/PageSection'
import { UpgradeStepsTable } from '../UpgradeStepsTable'
import { BackingUpStateProps, UPGRADE_STATE_CONTENT } from '../types'

export const BackingUpState = ({
  projectRef,
  projectName,
  displayTargetVersion,
  initiatedAt,
}: BackingUpStateProps) => {
  const content = UPGRADE_STATE_CONTENT.backingUp

  const initiatedAtUTC = dayjs.utc(initiatedAt ?? 0).format('DD MMM YYYY HH:mm:ss')
  const initiatedAtLocal = dayjs
    .utc(initiatedAt ?? 0)
    .local()
    .format('DD MMM YYYY HH:mm:ss (ZZ)')

  return (
    // TODO: this is basically the same as the UpgradingState component, so we should refactor it to be a shared component
    <PageSection>
      {/* Steps table */}
      <div className="flex flex-col gap-y-3">
        <h3 className="text-lg">{content.stepsHeading}</h3>
        <UpgradeStepsTable variant="backingUp" />
      </div>
      {/* Backup metadata */}
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
          .
        </p>
      )}
    </PageSection>
  )
}
