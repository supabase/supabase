import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { PauseCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useProjectPauseStatusQuery } from 'data/projects/project-pause-status-query'
import { useProjectRestoreMutation } from 'data/projects/project-restore-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useFlag } from 'hooks/ui/useFlag'
import { PROJECT_STATUS } from 'lib/constants'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, Modal } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'
import { useProjectContext } from '../ProjectContext'
import { RestorePaidPlanProjectNotice } from '../RestorePaidPlanProjectNotice'
import { PauseDisabledState } from './PauseDisabledState'

export interface ProjectPausedStateProps {
  product?: string
}

export const ProjectPausedState = ({ product }: ProjectPausedStateProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const selectedOrganization = useSelectedOrganization()
  const enforceNinetyDayUnpauseExpiry = useFlag('enforceNinetyDayUnpauseExpiry')

  const orgSlug = selectedOrganization?.slug
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug })
  const {
    data: pauseStatus,
    error: pauseStatusError,
    isError,
    isSuccess,
    isLoading,
  } = useProjectPauseStatusQuery(
    { ref },
    {
      enabled: project?.status === PROJECT_STATUS.INACTIVE && enforceNinetyDayUnpauseExpiry,
    }
  )

  const finalDaysRemainingBeforeRestoreDisabled =
    pauseStatus?.remaining_days_till_restore_disabled ??
    pauseStatus?.max_days_till_restore_disabled ??
    0

  const isFreePlan = subscription?.plan?.id === 'free'
  const isRestoreDisabled = enforceNinetyDayUnpauseExpiry && isSuccess && !pauseStatus.can_restore

  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery(
    { slug: orgSlug },
    { enabled: isFreePlan }
  )

  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0
  const [showConfirmRestore, setShowConfirmRestore] = useState(false)
  const [showFreeProjectLimitWarning, setShowFreeProjectLimitWarning] = useState(false)

  const { mutate: restoreProject } = useProjectRestoreMutation({
    onSuccess: (_, variables) => {
      setProjectStatus(queryClient, variables.ref, PROJECT_STATUS.RESTORING)
      toast.success('Restoring project')
    },
  })

  const canResumeProject = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_jobs.projects.initialize_or_resume'
  )

  const onSelectRestore = () => {
    if (!canResumeProject) {
      toast.error('You do not have the required permissions to restore this project')
    } else if (hasMembersExceedingFreeTierLimit) setShowFreeProjectLimitWarning(true)
    else setShowConfirmRestore(true)
  }

  const onConfirmRestore = () => {
    if (!project) {
      return toast.error('Unable to restore: project is required')
    }
    restoreProject({ ref: project.ref })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="w-full mx-auto mb-16 max-w-7xl">
          <div className="mx-6 flex h-[500px] items-center justify-center rounded border border-overlay bg-surface-100 p-8">
            <div className="grid w-[550px] gap-4">
              <div className="mx-auto flex max-w-[300px] items-center justify-center space-x-4 lg:space-x-8">
                <PauseCircle className="text-foreground-light" size={50} strokeWidth={1.5} />
              </div>

              <div className="flex flex-col gap-y-2">
                <div className="flex flex-col gap-y-1">
                  <p className="text-center">
                    The project "{project?.name ?? ''}" is currently paused.
                  </p>
                  <p className="text-sm text-foreground-light text-center">
                    All of your project's data is still intact, but your project is inaccessible
                    while paused.{' '}
                    {product !== undefined ? (
                      <>
                        Restore this project to access the{' '}
                        <span className="text-brand">{product}</span> page
                      </>
                    ) : (
                      'Restore this project and get back to building!'
                    )}
                  </p>
                </div>

                {enforceNinetyDayUnpauseExpiry && (
                  <>
                    {isLoading && <GenericSkeletonLoader />}
                    {isError && (
                      <AlertError
                        error={pauseStatusError}
                        subject="Failed to retrieve pause status"
                      />
                    )}
                    {isSuccess && (
                      <>
                        {isRestoreDisabled ? (
                          <PauseDisabledState />
                        ) : isFreePlan ? (
                          <>
                            <p className="text-sm text-foreground-light text-center">
                              To prevent future pauses, consider upgrading to Pro.
                            </p>
                            <Alert_Shadcn_>
                              <AlertTitle_Shadcn_>
                                Project can be restored through the dashboard within the next{' '}
                                {finalDaysRemainingBeforeRestoreDisabled} day
                                {finalDaysRemainingBeforeRestoreDisabled > 1 ? 's' : ''}
                              </AlertTitle_Shadcn_>
                              <AlertDescription_Shadcn_>
                                Free projects cannot be restored through the dashboard if they are
                                paused for more than{' '}
                                <span className="text-foreground">
                                  {pauseStatus?.max_days_till_restore_disabled} days
                                </span>
                                . The latest that your project can be restored is by{' '}
                                <span className="text-foreground">
                                  {dayjs()
                                    .utc()
                                    .add(pauseStatus.max_days_till_restore_disabled ?? 0, 'day')
                                    .format('DD MMM YYYY')}
                                </span>
                                . However, your database backup will still be available for download
                                thereafter.
                              </AlertDescription_Shadcn_>
                            </Alert_Shadcn_>
                          </>
                        ) : (
                          <RestorePaidPlanProjectNotice />
                        )}
                      </>
                    )}
                  </>
                )}

                {!enforceNinetyDayUnpauseExpiry && !isFreePlan && <RestorePaidPlanProjectNotice />}
              </div>

              {(!enforceNinetyDayUnpauseExpiry || (isSuccess && !isRestoreDisabled)) && (
                <div className="flex items-center justify-center gap-4">
                  <ButtonTooltip
                    size="tiny"
                    type="default"
                    disabled={!canResumeProject}
                    onClick={onSelectRestore}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: 'You need additional permissions to resume this project',
                      },
                    }}
                  >
                    Restore project
                  </ButtonTooltip>
                  {isFreePlan ? (
                    <Button asChild type="primary">
                      <Link href={`/org/${orgSlug}/billing?panel=subscriptionPlan`}>
                        Upgrade to Pro
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild type="default">
                      <Link href={`/project/${ref}/settings/general`}>View project settings</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        visible={showConfirmRestore}
        title="Restore this project"
        description="Confirm to restore this project? Your project's data will be restored to when it was initially paused."
        buttonLabel="Restore project"
        buttonLoadingLabel="Restoring project"
        onSelectCancel={() => setShowConfirmRestore(false)}
        onSelectConfirm={onConfirmRestore}
      />

      <Modal
        hideFooter
        visible={showFreeProjectLimitWarning}
        size="medium"
        header="Your organization has members who have exceeded their free project limits"
        onCancel={() => setShowFreeProjectLimitWarning(false)}
      >
        <Modal.Content className="space-y-2">
          <p className="text-sm text-foreground-light">
            The following members have reached their maximum limits for the number of active free
            plan projects within organizations where they are an administrator or owner:
          </p>
          <ul className="pl-5 text-sm list-disc text-foreground-light">
            {(membersExceededLimit || []).map((member, idx: number) => (
              <li key={`member-${idx}`}>
                {member.username || member.primary_email} (Limit: {member.free_project_limit} free
                projects)
              </li>
            ))}
          </ul>
          <p className="text-sm text-foreground-light">
            These members will need to either delete, pause, or upgrade one or more of these
            projects before you're able to unpause this project.
          </p>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <Button
            htmlType="button"
            type="default"
            onClick={() => setShowFreeProjectLimitWarning(false)}
            block
          >
            Understood
          </Button>
        </Modal.Content>
      </Modal>
    </>
  )
}
