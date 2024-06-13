import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, PauseCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useBackupsQuery } from 'data/database/backups-query'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useProjectPauseStatusQuery } from 'data/projects/project-pause-status-query'
import { useProjectRestoreMutation } from 'data/projects/project-restore-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, useSelectedOrganization } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Modal,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'
import { useProjectContext } from './ProjectContext'

export interface ProjectPausedStateProps {
  product?: string
}

const ProjectPausedState = ({ product }: ProjectPausedStateProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const selectedOrganization = useSelectedOrganization()

  const orgSlug = selectedOrganization?.slug
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug })
  // const { data: pauseStatus } = useProjectPauseStatusQuery(
  //   { ref },
  //   { enabled: project?.status === PROJECT_STATUS.INACTIVE }
  // )

  const isFreePlan = subscription?.plan?.id === 'free'
  const isRestoreDisabled = false // !pauseStatus?.can_restore

  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery(
    { slug: orgSlug },
    { enabled: isFreePlan }
  )
  const { data: backups } = useBackupsQuery({ projectRef: ref })
  const sortedBackups = (backups?.backups ?? []).sort(
    (a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
  )
  const latestBackup = sortedBackups[0]

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

                {/* {isRestoreDisabled ? (
                  <Alert_Shadcn_ variant="warning">
                    <WarningIcon />
                    <AlertTitle_Shadcn_>
                      Project cannot be restored through the dashboard
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      This project has been paused for over{' '}
                      <span className="text-foreground">
                        {pauseStatus?.max_days_till_restore_disabled ?? 90} days
                      </span>{' '}
                      and cannot be restored through the dashboard. However, your data remains
                      intact and can be downloaded as a backup.
                    </AlertDescription_Shadcn_>
                    <AlertDescription_Shadcn_ className="flex items-center gap-x-2 mt-3">
                      <Tooltip_Shadcn_>
                        <TooltipTrigger_Shadcn_ asChild>
                          <Button
                            type="default"
                            disabled={latestBackup === undefined}
                            className="pointer-events-auto"
                          >
                            Download backup
                          </Button>
                        </TooltipTrigger_Shadcn_>
                        {latestBackup === undefined && (
                          <TooltipContent_Shadcn_ side="bottom">
                            No backups available
                          </TooltipContent_Shadcn_>
                        )}
                      </Tooltip_Shadcn_>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                ) : isFreePlan ? (
                  <>
                    <p className="text-sm text-foreground-light text-center">
                      To prevent future pauses, consider upgrading to Pro.
                    </p>
                    <Alert_Shadcn_>
                      <AlertTitle_Shadcn_>
                        Project can be restored through the dashboard within the next{' '}
                        {pauseStatus.remaining_days_till_restore_disabled} day
                        {(pauseStatus?.remaining_days_till_restore_disabled ?? 0) > 1 ? 's' : ''}
                      </AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        Free projects cannot be restored through the dashboard if they are paused
                        for more than{' '}
                        <span className="text-foreground">
                          {pauseStatus.max_days_till_restore_disabled} days
                        </span>
                        . However, your database backup will still be available for download.
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  </>
                ) : null} */}

                {!isFreePlan && (
                  <Alert_Shadcn_>
                    <WarningIcon />
                    <AlertTitle_Shadcn_>
                      Project will count towards compute usage once restored
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      For every hour your instance is active, we will bill you based on the instance
                      size of your project.
                    </AlertDescription_Shadcn_>
                    <AlertDescription_Shadcn_ className="mt-3">
                      <Button asChild type="default" icon={<ExternalLink />}>
                        <a
                          href="https://supabase.com/docs/guides/platform/org-based-billing#usage-based-billing-for-compute"
                          target="_blank"
                          rel="noreferrer"
                        >
                          More information
                        </a>
                      </Button>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
              </div>

              {!isRestoreDisabled && (
                <div className="flex items-center justify-center gap-4">
                  <Tooltip_Shadcn_>
                    <TooltipTrigger_Shadcn_ asChild>
                      <Button
                        size="tiny"
                        type="default"
                        disabled={!canResumeProject}
                        onClick={onSelectRestore}
                      >
                        Restore project
                      </Button>
                    </TooltipTrigger_Shadcn_>
                    {!canResumeProject && (
                      <TooltipContent_Shadcn_ side="bottom">
                        You need additional permissions to resume this project
                      </TooltipContent_Shadcn_>
                    )}
                  </Tooltip_Shadcn_>
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

export default ProjectPausedState
