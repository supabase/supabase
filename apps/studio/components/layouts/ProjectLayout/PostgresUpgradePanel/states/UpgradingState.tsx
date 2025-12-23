import dayjs from 'dayjs'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
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
    <div className="grid w-[480px] gap-4">
      <div className="space-y-2">
        {isPerformingBackup ? (
          <div>
            <p className="text-center">Performing a full backup</p>
            <p className="text-sm text-center text-foreground-light">
              Upgrade is now complete, and your project is online. A full backup is now being
              performed to ensure that there is a proper base backup available post-upgrade. This
              can take from a few minutes up to several hours depending on the size of your
              database.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-center">Upgrading in progress</p>
            <p className="text-sm text-center text-foreground-light">
              Upgrades can take from a few minutes up to several hours depending on the size of your
              database. Your project will be offline while it is being upgraded.
            </p>
          </div>
        )}

        <h3 className="text-lg">{content.stepsHeading}</h3>
        <UpgradeStepsTable progress={progress} showProgress={true} />

        {initiatedAt !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="block w-full text-center">
                <p className="text-sm text-center text-foreground-light">
                  Upgrade began at {initiatedAtUTC} (UTC)
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-center">
              {initiatedAtLocal}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

