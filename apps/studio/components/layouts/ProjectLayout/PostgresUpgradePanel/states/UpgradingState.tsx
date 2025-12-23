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
  isPerformingBackup,
  initiatedAt,
}: UpgradingStateProps) => {
  const content = UPGRADE_STATE_CONTENT.upgrading

  const initiatedAtUTC = dayjs.utc(initiatedAt ?? 0).format('DD MMM YYYY HH:mm:ss')
  const initiatedAtLocal = dayjs
    .utc(initiatedAt ?? 0)
    .local()
    .format('DD MMM YYYY HH:mm:ss (ZZ)')

  return (
    <PageSection>
      {isPerformingBackup && (
        <div>
          <p className="text-center">Performing a full backup</p>
          <p className="text-sm text-center text-foreground-light">
            Upgrade is now complete, and your project is online. A full backup is now being
            performed to ensure that there is a proper base backup available post-upgrade. This can
            take from a few minutes up to several hours depending on the size of your database.
          </p>
        </div>
      )}

      <h3 className="text-lg">{content.stepsHeading}</h3>
      <UpgradeStepsTable
        progress={progress}
        showProgress={true}
        isPerformingBackup={isPerformingBackup}
      />

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
    </PageSection>
  )
}
