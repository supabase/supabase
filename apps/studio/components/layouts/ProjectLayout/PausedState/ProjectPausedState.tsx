import { useParams } from 'common'
import dayjs from 'dayjs'
import { PauseCircle } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { PauseDisabledState } from './PauseDisabledState'
import { ResumeProjectButton } from '@/components/interfaces/Project/ResumeProjectButton'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useProjectPauseStatusQuery } from '@/data/projects/project-pause-status-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { PROJECT_STATUS } from '@/lib/constants'

export interface ProjectPausedStateProps {
  product?: string
}

export const ProjectPausedState = ({ product }: ProjectPausedStateProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const enableProBenefitWording = usePHFlag('proBenefitWording')

  const {
    data: pauseStatus,
    error: pauseStatusError,
    isError,
    isSuccess: isPauseStatusSuccess,
    isPending: isLoading,
  } = useProjectPauseStatusQuery({ ref }, { enabled: project?.status === PROJECT_STATUS.INACTIVE })

  const finalDaysRemainingBeforeRestoreDisabled =
    pauseStatus?.remaining_days_till_restore_disabled ??
    pauseStatus?.max_days_till_restore_disabled ??
    0

  const isFreePlan = selectedOrganization?.plan?.id === 'free'
  const isRestoreDisabled = isPauseStatusSuccess && !pauseStatus.can_restore

  return (
    <Card className="w-full max-w-160 mx-auto">
      <CardContent>
        <PauseCircle size={48} strokeWidth={1} className="text-foreground-lighter shrink-0 mb-4" />
        <div className="flex-1">
          <div>
            <h2 className="mb-4">The project "{project?.name}" is currently paused</h2>
            <div className="text-foreground-light max-w-4xl">
              {isLoading && <GenericSkeletonLoader className="mt-3" />}

              {isPauseStatusSuccess && !isRestoreDisabled ? (
                isFreePlan ? (
                  <>
                    <p className="text-sm">
                      All data, including backups and storage objects, remains safe. You can resume
                      this project from the dashboard within{' '}
                      <Tooltip>
                        <TooltipTrigger>
                          <span className={cn(InlineLinkClassName, 'text-foreground')}>
                            {finalDaysRemainingBeforeRestoreDisabled} day
                            {finalDaysRemainingBeforeRestoreDisabled > 1 ? 's' : ''}
                          </span>{' '}
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="w-80 text-center">
                          Free projects cannot be restored through the dashboard if they are paused
                          for more than {pauseStatus.max_days_till_restore_disabled} days
                        </TooltipContent>
                      </Tooltip>{' '}
                      (until{' '}
                      <TimestampInfo
                        displayAs="local"
                        utcTimestamp={dayjs()
                          .utc()
                          .add(pauseStatus.remaining_days_till_restore_disabled ?? 0, 'day')
                          .toISOString()}
                        className="text-sm text-foreground"
                        labelFormat="DD MMM YYYY"
                      />
                      ). After that, this project will not be resumable, but data will still be
                      available for download.
                    </p>
                    <p className="text-sm mt-4">
                      {enableProBenefitWording === 'variant-a'
                        ? 'Upgrade to Pro to prevent pauses and unlock features like branching, compute upgrades, and daily backups.'
                        : 'To prevent future pauses, consider upgrading to Pro.'}
                    </p>
                    {!!pauseStatus.last_paused_on && (
                      <p className="text-foreground-lighter text-sm">
                        Project last paused on{' '}
                        <TimestampInfo
                          className="text-sm"
                          labelFormat="DD MMM YYYY"
                          utcTimestamp={pauseStatus.last_paused_on}
                        />
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm">
                    Your project data is safe but inaccessible while paused. Once resumed, usage
                    will be billed by compute size and hours active.
                  </p>
                )
              ) : !isLoading ? (
                <p className="text-sm">
                  All of your project's data is still intact, but your project is inaccessible while
                  paused.{' '}
                  {product !== undefined ? (
                    <>
                      Resume this project to access the{' '}
                      <span className="text-brand">{product}</span> page.
                    </>
                  ) : !isRestoreDisabled ? (
                    'Resume this project and get back to building!'
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>

      {isError && (
        <AlertError
          className="rounded-none border-0"
          error={pauseStatusError}
          subject="Failed to retrieve pause status"
        />
      )}

      {isPauseStatusSuccess && !isRestoreDisabled && (
        <CardFooter className="flex flex-wrap justify-end items-center gap-2">
          <ResumeProjectButton size="tiny" type="default" />

          {isFreePlan ? (
            <UpgradePlanButton source="projectPausedStateRestore" />
          ) : (
            <Button asChild type="default">
              <Link href={`/project/${ref}/settings/general`}>View project settings</Link>
            </Button>
          )}
        </CardFooter>
      )}

      {isPauseStatusSuccess && isRestoreDisabled && <PauseDisabledState />}
    </Card>
  )
}
